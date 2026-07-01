package com.collabboard.backend.entity;

public class DrawingMessage {

    private String senderId;
    private String boardData;

    public DrawingMessage() {
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getBoardData() {
        return boardData;
    }

    public void setBoardData(String boardData) {
        this.boardData = boardData;
    }
}