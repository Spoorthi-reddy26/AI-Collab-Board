package com.collabboard.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.collabboard.backend.entity.Board;
import com.collabboard.backend.service.BoardService;

@RestController
@RequestMapping("/api/boards")
@CrossOrigin(origins = "http://localhost:5173")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @PostMapping("/save")
    public Board saveBoard(@RequestBody Board board) {
        return boardService.saveBoard(board);
    }

    @GetMapping
    public List<Board> getBoards() {
        return boardService.getAllBoards();
    }

    @GetMapping("/{id}")
    public Board getBoard(@PathVariable Long id) {
        return boardService.getBoardById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Board> getBoardsByUser(@PathVariable Long userId) {
        return boardService.getBoardsByUserId(userId);
    }

    @PutMapping("/{id}")
    public Board updateBoard(@PathVariable Long id, @RequestBody UpdateBoardRequest request) {
        return boardService.updateBoard(id, request.getTitle(), request.getBoardData());
    }

    @DeleteMapping("/{id}")
    public void deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
    }

    @PutMapping("/{id}/rename")
    public Board renameBoard(@PathVariable Long id, @RequestBody RenameRequest request) {
        return boardService.renameBoard(id, request.getTitle());
    }

    public static class RenameRequest {
        private String title;
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
    }

    public static class UpdateBoardRequest {
        private String title;
        private String boardData;
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getBoardData() { return boardData; }
        public void setBoardData(String boardData) { this.boardData = boardData; }
    }
}