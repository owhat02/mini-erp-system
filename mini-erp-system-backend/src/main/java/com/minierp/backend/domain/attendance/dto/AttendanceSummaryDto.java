package com.minierp.backend.domain.attendance.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.time.LocalDate;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AttendanceSummaryDto {

    private final int workDaysCount;
    private final List<String> clockInTimes;
    private final List<String> clockOutTimes;
    private final int leaveUsedCount;
    private final List<AttendanceRecordDto> attendanceRecords;

    public static AttendanceSummaryDto of(
            int workDaysCount,
            List<String> clockInTimes,
            List<String> clockOutTimes,
            int leaveUsedCount,
            List<AttendanceRecordDto> attendanceRecords
    ) {
        return new AttendanceSummaryDto(workDaysCount, clockInTimes, clockOutTimes, leaveUsedCount, attendanceRecords);
    }

    @Getter
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class AttendanceRecordDto {
        private final LocalDate workDate;
        private final String clockInTime;
        private final String clockOutTime;
        private final String status;

        public static AttendanceRecordDto of(LocalDate workDate, String clockInTime, String clockOutTime, String status) {
            return new AttendanceRecordDto(workDate, clockInTime, clockOutTime, status);
        }
    }
}
