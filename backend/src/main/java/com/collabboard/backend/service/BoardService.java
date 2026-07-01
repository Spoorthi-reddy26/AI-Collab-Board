package com.collabboard.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.collabboard.backend.entity.Board;
import com.collabboard.backend.repository.BoardRepository;

@Service
public class BoardService {

    private final BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }

    public Board saveBoard(Board board) {
        return boardRepository.save(board);
    }

    public List<Board> getAllBoards() {
        return boardRepository.findAll();
    }

    public Board getBoardById(Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));
    }

    public List<Board> getBoardsByUserId(Long userId) {
        return boardRepository.findByUserId(userId);
    }

    public Board updateBoard(Long id, String title, String boardData) {
        Board board = getBoardById(id);
        if (title != null) board.setTitle(title);
        if (boardData != null) board.setBoardData(boardData);
        return boardRepository.save(board);
    }

    public void deleteBoard(Long id) {
        boardRepository.deleteById(id);
    }

    public Board renameBoard(Long id, String newTitle) {
        Board board = getBoardById(id);
        board.setTitle(newTitle);
        return boardRepository.save(board);
    }
}