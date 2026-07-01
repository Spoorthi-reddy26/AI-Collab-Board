import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fabric } from "fabric";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function WhiteboardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const senderIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isHistoryActionRef = useRef<boolean>(false);
  const boardTitleRef = useRef<string>("Untitled Board");

  const [boardTitle, setBoardTitle] = useState<string>("Untitled Board");
  const [activeTool, setActiveTool] = useState<string>("draw");
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushWidth, setBrushWidth] = useState<number>(4);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 240,
      height: window.innerHeight - 64,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;
    fabricCanvasRef.current = canvas;

    if (boardId && boardId !== "new") {
      loadBoardData(canvas);
    } else {
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = [json];
      historyIndexRef.current = 0;
    }

    connectWebSocket(canvas);

    const broadcastUpdate = () => {
      if (isRemoteUpdateRef.current || isHistoryActionRef.current) return;
      if (!stompClientRef.current?.connected) return;
      const channelId = boardId && boardId !== "new" ? boardId : senderIdRef.current;
      stompClientRef.current.publish({
        destination: `/app/draw/${channelId}`,
        body: JSON.stringify({
          senderId: senderIdRef.current,
          boardData: JSON.stringify(canvas.toJSON()),
        }),
      });
    };

    const saveAndBroadcast = () => {
      if (isHistoryActionRef.current || isRemoteUpdateRef.current) return;
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;
      broadcastUpdate();
    };

    canvas.on("object:added", saveAndBroadcast);
    canvas.on("object:modified", saveAndBroadcast);
    canvas.on("object:removed", saveAndBroadcast);
    canvas.on("path:created", saveAndBroadcast);

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 240,
        height: window.innerHeight - 64,
      });
      canvas.renderAll();
    };
    window.addEventListener("resize", handleResize);

    const handleKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      if (e.key === "Delete") {
        const active = canvas.getActiveObject();
        if (active) { canvas.remove(active); canvas.renderAll(); }
      }
    };
    window.addEventListener("keydown", handleKeys);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeys);
      stompClientRef.current?.deactivate();
      canvas.dispose();
    };
  }, [boardId]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.freeDrawingBrush.width = brushWidth * 3;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, brushColor, brushWidth]);

  const loadBoardData = async (canvas: fabric.Canvas) => {
    try {
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}`);
      if (!response.ok) throw new Error("Failed to load board");
      const data = await response.json();
      // Update both state and ref so title is always correct
      setBoardTitle(data.title);
      boardTitleRef.current = data.title;
      if (data.boardData) {
        isRemoteUpdateRef.current = true;
        canvas.loadFromJSON(data.boardData, () => {
          canvas.renderAll();
          isRemoteUpdateRef.current = false;
          const json = JSON.stringify(canvas.toJSON());
          historyRef.current = [json];
          historyIndexRef.current = 0;
        });
      }
    } catch (err) {
      console.error("Failed to load board:", err);
    }
  };

  const connectWebSocket = (canvas: fabric.Canvas) => {
    const channelId = boardId && boardId !== "new" ? boardId : senderIdRef.current;
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      client.subscribe(`/topic/draw/${channelId}`, (message) => {
        const parsed = JSON.parse(message.body);
        if (parsed.senderId === senderIdRef.current) return;
        isRemoteUpdateRef.current = true;
        canvas.loadFromJSON(parsed.boardData, () => {
          canvas.renderAll();
          isRemoteUpdateRef.current = false;
        });
      });
    };

    client.onDisconnect = () => setIsConnected(false);
    client.activate();
    stompClientRef.current = client;
  };

  const undo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    isHistoryActionRef.current = true;
    historyIndexRef.current--;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
      canvas.renderAll();
      isHistoryActionRef.current = false;
    });
  };

  const redo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    isHistoryActionRef.current = true;
    historyIndexRef.current++;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
      canvas.renderAll();
      isHistoryActionRef.current = false;
    });
  };

  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 120, top: 120,
      fill: "transparent", stroke: brushColor,
      strokeWidth: 2, width: 150, height: 100,
    });
    canvas.isDrawingMode = false;
    setActiveTool("select");
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 150, top: 150,
      fill: "transparent", stroke: brushColor,
      strokeWidth: 2, radius: 60,
    });
    canvas.isDrawingMode = false;
    setActiveTool("select");
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Double click to edit", {
      left: 200, top: 200,
      fill: brushColor, fontSize: 22,
    });
    canvas.isDrawingMode = false;
    setActiveTool("select");
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (!window.confirm("Clear the entire board? This cannot be undone.")) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    if (stompClientRef.current?.connected) {
      const channelId = boardId && boardId !== "new" ? boardId : senderIdRef.current;
      stompClientRef.current.publish({
        destination: `/app/draw/${channelId}`,
        body: JSON.stringify({
          senderId: senderIdRef.current,
          boardData: JSON.stringify(canvas.toJSON()),
        }),
      });
    }
  };

  const exportPNG = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${boardTitleRef.current}.png`;
    link.click();
  };

  const saveBoard = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    const userId = localStorage.getItem("userId");

    // New board — ask for name
    if (!boardId || boardId === "new") {
      const title = window.prompt("Name your board:", "Untitled Board") || "Untitled Board";
      setBoardTitle(title);
      boardTitleRef.current = title;
      try {
        const response = await fetch("http://localhost:8080/api/boards/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            boardData: json,
            userId: userId ? Number(userId) : null,
          }),
        });
        if (!response.ok) throw new Error("Save failed");
        const saved = await response.json();
        alert(`Board "${title}" saved!`);
        navigate(`/whiteboard/${saved.id}`, { replace: true });
      } catch (err) {
        console.error(err);
        alert("Failed to save board");
      }
      return;
    }

    // Existing board — use boardTitleRef (always has the correct current title)
    try {
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: boardTitleRef.current,
          boardData: json,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      alert(`Board "${boardTitleRef.current}" saved!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save board");
    }
  };

  const loadBoard = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !boardId || boardId === "new") return;
    try {
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}`);
      if (!response.ok) throw new Error("Load failed");
      const data = await response.json();
      setBoardTitle(data.title);
      boardTitleRef.current = data.title;
      isRemoteUpdateRef.current = true;
      canvas.loadFromJSON(data.boardData, () => {
        canvas.renderAll();
        isRemoteUpdateRef.current = false;
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load board");
    }
  };

  // Update both state and ref when title is edited inline
  const handleTitleChange = (newTitle: string) => {
    setBoardTitle(newTitle);
    boardTitleRef.current = newTitle;
  };

  const tools = [
    { id: "select", label: "Select", emoji: "🖱" },
    { id: "draw", label: "Draw", emoji: "✏️" },
    { id: "eraser", label: "Erase", emoji: "🧽" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top bar */}
      <div className="h-16 bg-[#15182E] text-white flex items-center justify-between px-6 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0673E] font-bold text-sm flex-shrink-0">
            C
          </div>
          <div>
            {/* Editable board title — click to rename */}
            {editingTitle ? (
              <input
                autoFocus
                type="text"
                value={boardTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }}
                className="text-sm font-bold bg-white/10 border border-white/30 rounded px-2 py-0.5 text-white outline-none w-48"
              />
            ) : (
              <h1
                className="text-sm font-bold leading-tight cursor-pointer hover:text-[#E0673E] transition"
                onClick={() => setEditingTitle(true)}
                title="Click to rename"
              >
                {boardTitle} ✎
              </h1>
            )}
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              <p className="text-xs text-slate-400">
                {isConnected ? "Live sync active" : "Reconnecting..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={undo} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition">↩ Undo</button>
          <button onClick={redo} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition">↪ Redo</button>
          <button onClick={exportPNG} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition">📤 Export</button>
          <button onClick={loadBoard} className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition">📂 Load</button>
          <button onClick={saveBoard} className="px-4 py-1.5 text-xs font-semibold bg-[#E0673E] hover:bg-[#c95a35] rounded-lg transition">💾 Save</button>
          <button onClick={() => navigate("/dashboard")} className="px-3 py-1.5 text-xs font-medium border border-white/20 hover:bg-white/10 rounded-lg transition">← Dashboard</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[200px] bg-white border-r flex flex-col p-4 gap-5 shadow-sm flex-shrink-0 overflow-y-auto">

          {/* Tools */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tools</p>
            <div className="flex flex-col gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTool === tool.id
                      ? "bg-[#1B1F3B] text-white"
                      : "text-slate-600 hover:bg-slate-50 border border-slate-100"
                  }`}
                >
                  <span>{tool.emoji}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Shapes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Shapes</p>
            <div className="flex flex-col gap-1">
              <button onClick={addRectangle} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition">
                ▭ Rectangle
              </button>
              <button onClick={addCircle} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition">
                ⚪ Circle
              </button>
              <button onClick={addText} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition">
                🔤 Text
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Color */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Color</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <span className="text-sm font-mono text-slate-600">{brushColor}</span>
            </div>
          </div>

          {/* Brush size */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Brush ({brushWidth}px)
            </p>
            <input
              type="range" min="1" max="50"
              value={brushWidth}
              onChange={(e) => setBrushWidth(parseInt(e.target.value))}
              className="w-full accent-[#E0673E]"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Actions */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Actions</p>
            <div className="flex flex-col gap-1">
              <button onClick={deleteSelected} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 border border-rose-100 transition">
                🗑 Delete Selected
              </button>
              <button onClick={clearCanvas} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 border border-dashed border-slate-300 transition">
                🧹 Clear Canvas
              </button>
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 bg-slate-100 overflow-auto flex items-start justify-center p-4">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200/60">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}