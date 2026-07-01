package com.collabboard.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "boards")
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String boardData;

    private Long userId;

    public Board() {
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getBoardData() {
        return boardData;
    }

    public Long getUserId() {
        return userId;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setBoardData(String boardData) {
        this.boardData = boardData;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}