package com.beastmovieflix.controller;

import com.beastmovieflix.dto.MovieLogDTO.CreateLogRequest;
import com.beastmovieflix.dto.MovieLogDTO.LogResponse;
import com.beastmovieflix.dto.MovieLogDTO.UpdateLogRequest;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.service.MovieLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * MovieLog Controller - Handle movie diary operations
 * 
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class MovieLogController {

    private final MovieLogService movieLogService;

    @PostMapping
    public ResponseEntity<LogResponse> createLog(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateLogRequest request) {
        LogResponse response = movieLogService.createLog(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<LogResponse>> getUserLogs(@AuthenticationPrincipal User user) {
        List<LogResponse> logs = movieLogService.getUserLogs(user.getId());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{logId}")
    public ResponseEntity<LogResponse> getLog(@PathVariable Long logId) {
        LogResponse log = movieLogService.getLog(logId);
        return ResponseEntity.ok(log);
    }

    @PutMapping("/{logId}")
    public ResponseEntity<LogResponse> updateLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateLogRequest request) {
        LogResponse response = movieLogService.updateLog(logId, user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {
        movieLogService.deleteLog(logId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
