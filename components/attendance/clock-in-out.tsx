"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MdAccessTime, MdLogout, MdLocationOn, MdCameraAlt, MdPhotoCamera, MdClose, MdFreeBreakfast } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { fetchTodayAttendance, clockIn, clockOut, breakStart, breakEnd, type AttendanceDetail, type ShiftListItem } from "@/lib/client/attendance";

export function ClockInOut() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [shift, setShift] = useState<ShiftListItem | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [enableLocation, setEnableLocation] = useState(true);
  const [enablePhoto, setEnablePhoto] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksModalType, setRemarksModalType] = useState<"clockIn" | "clockOut" | "breakStart" | "breakEnd">("clockOut");
  const [remarks, setRemarks] = useState("");

  const loadTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTodayAttendance();

      if (result.error) {
        showError(result.error);
        return;
      }

      if (result.data) {
        setAttendance(result.data.attendance);
        setShift(result.data.shift);
        if (result.data.currentTime) {
          setCurrentTime(new Date(result.data.currentTime));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (enableLocation && !location && !locationLoading) {
      getLocation();
    }
  }, [enableLocation, location, locationLoading]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let address = "";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          address = data.display_name || "";
        } catch {
          address = "";
        }

        setLocation({ latitude, longitude, address });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      showError("Camera access denied. Please enable camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedPhoto(photoData);
        
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    const toastId = showLoading("Clocking in...");

    try {
      const result = await clockIn({
        clockInIp: await getClientIP(),
        clockInLocation: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        } : undefined,
        clockInPhoto: capturedPhoto || undefined,
        remarks: remarks || undefined,
      });

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Clocked in successfully!");
      loadTodayAttendance();
      setCapturedPhoto(null);
      setLocation(null);
    } finally {
      setActionLoading(false);
    }
  };

  const openClockInModal = () => {
    setRemarks("");
    setRemarksModalType("clockIn");
    setShowRemarksModal(true);
  };

  const openClockOutModal = () => {
    setRemarks("");
    setRemarksModalType("clockOut");
    setShowRemarksModal(true);
  };

  const openBreakStartModal = () => {
    setRemarks("");
    setRemarksModalType("breakStart");
    setShowRemarksModal(true);
  };

  const openBreakEndModal = () => {
    setRemarks("");
    setRemarksModalType("breakEnd");
    setShowRemarksModal(true);
  };

  const handleModalSubmit = async () => {
    setShowRemarksModal(false);

    if (remarksModalType === "clockIn") {
      await handleClockIn();
    } else if (remarksModalType === "clockOut") {
      await handleClockOut();
    } else if (remarksModalType === "breakStart") {
      await handleBreakStart();
    } else if (remarksModalType === "breakEnd") {
      await handleBreakEnd();
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    const toastId = showLoading("Clocking out...");

    try {
      const result = await clockOut({
        clockOutIp: await getClientIP(),
        clockOutLocation: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        } : undefined,
        remarks: remarks || undefined,
      });

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Clocked out successfully!");
      loadTodayAttendance();
      setLocation(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async () => {
    setActionLoading(true);
    const toastId = showLoading("Starting break...");

    try {
      const result = await breakStart({
        remarks: remarks || undefined,
      });

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Break started!");
      loadTodayAttendance();
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setActionLoading(true);
    const toastId = showLoading("Ending break...");

    try {
      const result = await breakEnd({
        remarks: remarks || undefined,
      });

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Break ended!");
      loadTodayAttendance();
    } finally {
      setActionLoading(false);
    }
  };

  const getClientIP = async (): Promise<string | undefined> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getWorkingHours = () => {
    if (!attendance?.clockIn || !attendance?.clockOut) return null;
    const start = new Date(attendance.clockIn);
    const end = new Date(attendance.clockOut);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (attendance.totalBreakMins) {
      diff -= attendance.totalBreakMins / 60;
    }
    return Math.max(0, diff).toFixed(2);
  };

  const getNetWorkingHours = () => {
    if (!attendance?.clockIn) return null;
    const start = new Date(attendance.clockIn);
    const now = new Date();
    let diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (attendance.breakStart && !attendance.breakEnd) {
      diff -= (now.getTime() - new Date(attendance.breakStart).getTime()) / (1000 * 60 * 60);
    } else if (attendance.totalBreakMins) {
      diff -= attendance.totalBreakMins / 60;
    }
    return Math.max(0, diff).toFixed(2);
  };

  const isOnBreak = () => {
    return !!(attendance?.breakStart && !attendance.breakEnd);
  };

  const canTakeBreak = () => {
    return !!(attendance?.clockIn && !attendance?.clockOut);
  };

  const hasCompletedBreak = () => {
    return !!(attendance?.breakStart && attendance?.breakEnd);
  };

  const showBreakEnd = () => {
    return !!(attendance?.clockIn && !attendance?.clockOut && (attendance?.breakStart || attendance?.breakEnd));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{formatTime(currentTime)}</div>
            <div className="text-blue-100 dark:text-blue-200">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="p-6">
          {shift && (
            <div className="flex items-center justify-center gap-2 mb-6 text-gray-600 dark:text-gray-300">
              <MdAccessTime className="w-5 h-5" />
              <span>
                Shift: {shift.startTime} - {shift.endTime}
              </span>
              {shift.isNightShift && (
                <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">Night</span>
              )}
              {shift.isFlexible && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">Flexible</span>
              )}
            </div>
          )}

          {attendance?.clockIn && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Clock In</div>
                <div className="text-xl font-semibold text-green-700 dark:text-green-400">
                  {new Date(attendance.clockIn).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                {attendance.clockInIp && (
                  <div className="text-xs text-green-500 dark:text-green-500 mt-1 flex items-center justify-center gap-1">
                    <MdLocationOn className="w-3 h-3" />
                    {attendance.clockInIp}
                  </div>
                )}
                {attendance.clockInPhoto && (
                  <div className="mt-2">
                    <img 
                      src={attendance.clockInPhoto} 
                      alt="Clock In" 
                      className="w-16 h-16 mx-auto rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <div className="text-sm text-red-600 dark:text-red-400 mb-1">Clock Out</div>
                {attendance.clockOut ? (
                  <>
                    <div className="text-xl font-semibold text-red-700 dark:text-red-400">
                      {new Date(attendance.clockOut).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    {attendance.clockOutIp && (
                      <div className="text-xs text-red-500 dark:text-red-500 mt-1 flex items-center justify-center gap-1">
                        <MdLocationOn className="w-3 h-3" />
                        {attendance.clockOutIp}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-lg font-medium text-red-400 dark:text-red-500">--:--</div>
                )}
              </div>
            </div>
          )}

          {attendance?.clockIn && !attendance?.clockOut && (
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Working Hours</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white">
                {getNetWorkingHours() || "--"}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">hours</span>
              </div>
            </div>
          )}

          {attendance?.clockOut && attendance?.totalHours !== null && (
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Working Hours</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white">
                {attendance?.totalHours?.toFixed(2) || getWorkingHours() || "--"}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">hours</span>
              </div>
              {attendance?.overtimeHours && attendance.overtimeHours > 0 && (
                <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Overtime: +{attendance.overtimeHours.toFixed(2)} hours
                </div>
              )}
            </div>
          )}

          {attendance?.status && (
            <div className="text-center mb-6">
              {isOnBreak() && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400">
                    On Break
                  </span>
                </div>
              )}
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                  attendance.status === "PRESENT"
                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                    : attendance.status === "LATE"
                    ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400"
                    : attendance.status === "HALF_DAY"
                    ? "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400"
                    : attendance.status === "ABSENT"
                    ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {attendance.status.replace("_", " ")}
              </span>
            </div>
          )}

          {attendance?.clockIn && !attendance?.clockOut && (
            <div className="mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <MdFreeBreakfast className="w-5 h-5" />
                    <span className="text-sm font-medium">Break Status</span>
                  </div>
                  <div className="text-right">
                    {attendance.breakStart && !attendance.breakEnd ? (
                      <div className="text-purple-600 dark:text-purple-400">
                        <div className="text-xs">Break started at</div>
                        <div className="font-semibold">
                          {new Date(attendance.breakStart).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                    ) : attendance.breakEnd ? (
                      <div className="text-purple-600 dark:text-purple-400">
                        <div className="text-xs">Break completed</div>
                        <div className="text-sm font-medium">
                          {attendance.totalBreakMins} mins
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm">Not started</div>
                    )}
                  </div>
                </div>
                {attendance.breakStart && attendance.breakEnd && (
                  <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-900 text-center">
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      Break: {new Date(attendance.breakStart).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })} - {new Date(attendance.breakEnd).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!attendance?.clockIn && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLocation}
                    onChange={(e) => setEnableLocation(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <MdLocationOn className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Capture Location</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePhoto}
                    onChange={(e) => setEnablePhoto(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <MdCameraAlt className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Capture Photo</span>
                </label>
              </div>

              {enableLocation && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {locationLoading && <span className="text-blue-600 dark:text-blue-400">Getting location...</span>}
                  {locationError && <span className="text-red-500 dark:text-red-400">{locationError}</span>}
                  {location && (
                    <span className="flex items-center gap-1">
                      <MdLocationOn className="w-3 h-3 text-green-500 dark:text-green-400" />
                      Location captured
                    </span>
                  )}
                </div>
              )}

              {enablePhoto && !capturedPhoto && !showCamera && (
                <button
                  onClick={startCamera}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-500"
                >
                  <MdPhotoCamera className="w-4 h-4" />
                  Take Photo
                </button>
              )}

              {showCamera && (
                <div className="mt-3">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm mx-auto rounded-lg" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-400 dark:hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {capturedPhoto && (
                <div className="mt-3">
                  <img src={capturedPhoto} alt="Captured" className="w-32 h-32 mx-auto rounded-lg object-cover" />
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="mt-2 mx-auto flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    <MdClose className="w-4 h-4" />
                    Retake
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!attendance?.clockIn ? (
              <button
                onClick={openClockInModal}
                disabled={actionLoading}
                className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <MdAccessTime className="w-5 h-5" />
                    Clock In
                  </>
                )}
              </button>
            ) : !attendance?.clockOut ? (
              <>
                <div className="flex gap-3">
                  {canTakeBreak() && (
                    <button
                      onClick={openBreakStartModal}
                      disabled={actionLoading}
                      className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <Spinner />
                      ) : (
                        <>
                          <MdFreeBreakfast className="w-5 h-5" />
                          Break In
                        </>
                      )}
                    </button>
                  )}
                  {showBreakEnd() && (
                    <button
                      onClick={openBreakEndModal}
                      disabled={actionLoading}
                      className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <Spinner />
                      ) : (
                        <>
                          <MdFreeBreakfast className="w-5 h-5" />
                          Break End
                        </>
                      )}
                    </button>
                  )}
                </div>
                <button
                  onClick={openClockOutModal}
                  disabled={actionLoading || isOnBreak()}
                  className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <MdLogout className="w-5 h-5" />
                      Clock Out
                    </>
                  )}
                </button>
                {isOnBreak() && (
                  <div className="text-center text-sm text-purple-600 dark:text-purple-400">
                    Please end your break before clocking out
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <div className="flex items-center justify-center gap-2">
                  <MdAccessTime className="w-5 h-5" />
                  <span>Attendance completed for today</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRemarksModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {remarksModalType === "clockIn" && "Clock In Remarks"}
              {remarksModalType === "clockOut" && "Clock Out Remarks"}
              {remarksModalType === "breakStart" && "Break Start Remarks"}
              {remarksModalType === "breakEnd" && "Break End Remarks"}
            </h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks (optional)..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRemarksModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {actionLoading ? <Spinner /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
