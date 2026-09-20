package com.monprojet.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(
            AnalyseIADejaGenereeException.class)
    public ResponseEntity<Map<String, String>>
    handleAnalyseIADejaGeneree(
            AnalyseIADejaGenereeException e) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        Map.of(
                                "message",
                                e.getMessage()
                        )
                );
    }
}