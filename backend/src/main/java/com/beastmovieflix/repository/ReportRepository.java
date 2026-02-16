package com.beastmovieflix.repository;

import com.beastmovieflix.entity.Report;
import com.beastmovieflix.entity.Report.ReportStatus;
import com.beastmovieflix.entity.Report.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    List<Report> findByReporterId(Long reporterId);

    List<Report> findByTargetIdAndType(Long targetId, ReportType type);

    long countByStatus(ReportStatus status);

    long countByTargetIdAndType(Long targetId, ReportType type);
}
