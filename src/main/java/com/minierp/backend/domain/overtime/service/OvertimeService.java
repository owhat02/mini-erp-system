package com.minierp.backend.domain.overtime.service;

import com.minierp.backend.domain.overtime.dto.OvertimeRequestDto;
import com.minierp.backend.domain.overtime.dto.OvertimeResponseDto;
import com.minierp.backend.domain.overtime.entity.OvertimeRequest;
import com.minierp.backend.domain.overtime.entity.OvertimeStatus;
import com.minierp.backend.domain.overtime.repository.OvertimeRequestRepository;
import com.minierp.backend.domain.user.entity.User;
import com.minierp.backend.domain.user.repository.UserRepository;
import com.minierp.backend.global.exception.BusinessException;
import com.minierp.backend.global.exception.ErrorCode;
import com.minierp.backend.global.service.AccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OvertimeService {

    private final OvertimeRequestRepository overtimeRequestRepository;
    private final UserRepository userRepository;
    private final AccessPolicy accessPolicy;

    /**
     * 특근 신청
     */
    @Transactional
    public OvertimeResponseDto requestOvertime(OvertimeRequestDto dto, Long requesterUserId) {
        // [특근 날짜 검증 보완] 시작일과 종료일이 정확히 동일한 날짜인지 검증
        if (!dto.getStartDate().equals(dto.getEndDate())) {
            throw new BusinessException(ErrorCode.INVALID_OVERTIME_PERIOD);
        }

        // 방어 코드: 시작 시간이 종료 시간보다 늦을 경우
        if (dto.getEndTime().isBefore(dto.getStartTime())) {
            throw new BusinessException(ErrorCode.INVALID_OVERTIME_TIME);
        }

        if (!isWeekend(dto.getStartDate())) {
            throw new BusinessException(ErrorCode.INVALID_OVERTIME_DATE);
        }

        User requester = getUserById(requesterUserId);

        OvertimeRequest request = OvertimeRequest.builder()
                .requester(requester)
                .overtimeDate(dto.getStartDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .reason(dto.getReason())
                .build();

        return OvertimeResponseDto.from(overtimeRequestRepository.save(request));
    }

    /**
     * 특근 신청 취소 (Soft Cancel)
     */
    @Transactional
    public void cancelOvertime(Long requestId, Long userId) {
        OvertimeRequest request = overtimeRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OVERTIME_NOT_FOUND));

        // [보안 규칙 B] 본인 확인 검증
        if (!request.getRequester().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "본인이 신청한 내역만 취소할 수 있습니다.");
        }

        // [보안 규칙 A] 상태 검증 (PENDING일 때만 취소 가능)
        if (request.getStatus() != OvertimeStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_OVERTIME_CANCEL_STATUS);
        }

        request.cancel();
    }

    /**
     * 특근 단건 조회 (권한 방어)
     */
    public OvertimeResponseDto getOvertimeRequest(Long requestId, Long accessorUserId) {
        OvertimeRequest request = getRequestOrThrow(requestId);
        User accessor = getUserById(accessorUserId);

        if (accessor.getUserRole().isGeneralUser() && !request.getRequester().getId().equals(accessor.getId())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "본인 특근 신청 건만 조회할 수 있습니다.");
        }

        return OvertimeResponseDto.from(request);
    }

    /**
     * 특근 승인
     */
    @Transactional
    public OvertimeResponseDto approveOvertime(Long requestId, Long approverUserId) {
        OvertimeRequest request = getRequestOrThrow(requestId);
        User approver = getUserById(approverUserId);

        validateApprovalHierarchy(request.getRequester(), approver);
        request.approve(approver);
        return OvertimeResponseDto.from(request);
    }

    /**
     * 특근 반려
     */
    @Transactional
    public OvertimeResponseDto rejectOvertime(Long requestId, Long approverUserId) {
        OvertimeRequest request = getRequestOrThrow(requestId);
        User approver = getUserById(approverUserId);

        validateApprovalHierarchy(request.getRequester(), approver);
        request.reject(approver);
        return OvertimeResponseDto.from(request);
    }

    /**
     * 특근 내역 조회 (권한별 필터링)
     */
    public List<OvertimeResponseDto> getOvertimeRequestList(Long accessorUserId) {
        User accessor = getUserById(accessorUserId);

        if (!accessor.getUserRole().isGeneralUser()) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "관리자는 /api/v1/overtime/all 엔드포인트를 사용해주세요.");
        }

        return overtimeRequestRepository.findByRequester_Id(accessor.getId()).stream()
                .map(OvertimeResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 특근 전체 내역 조회 (관리자용)
     */
    public List<OvertimeResponseDto> getAllOvertimeRequestList(Long userId) {
        User user = getUserById(userId);

        if (!accessPolicy.canViewAllRequests(user.getUserRole())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "관리자 권한이 필요합니다.");
        }

        return overtimeRequestRepository.findAll().stream()
                .map(OvertimeResponseDto::from)
                .collect(Collectors.toList());
    }

    private void validateApprovalHierarchy(User requester, User approver) {
        accessPolicy.validateApprovalHierarchy(
                requester.getUserRole(),
                requester.getId(),
                approver.getUserRole(),
                approver.getId()
        );
    }

    private OvertimeRequest getRequestOrThrow(Long requestId) {
        return overtimeRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OVERTIME_NOT_FOUND));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}
