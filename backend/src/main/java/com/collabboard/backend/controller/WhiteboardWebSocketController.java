package com.collabboard.backend.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.collabboard.backend.entity.DrawingMessage;

@Controller
public class WhiteboardWebSocketController {

    @MessageMapping("/draw/{boardId}")
    @SendTo("/topic/draw/{boardId}")
    public DrawingMessage sendDrawing(
            @DestinationVariable String boardId,
            DrawingMessage message) {
        System.out.println("Drawing update for board: " + boardId);
        return message;
    }
}