import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import EmployeeProfileHeader from "../components/EmployeeProfileHeader";
import AttendanceWidget from "../../attendance/components/AttendanceWidget";
import LeaveBalanceCard from "../../timeoff/components/LeaveBalanceCard";
import employeesApi from "../../../api/employees";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMyProfile() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const res = await employeesApi.getMyProfile();
        if (res.ok && (res.data?.employee || res.employee)) {
          setEmployee(res.data?.employee || res.employee);
        } else {
          setErrorMessage(
            res.message || "No employee record is linked to this user account."
          );
        }
      } catch (err) {
        console.error("Failed to load self employee profile:", err);
        setErrorMessage(err.message || "Failed to load employee profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadMyProfile();
  }, []);

  if (isLoading) {
    return (
      <PageContainer
        title="Employee Self-Service Portal"
        description="Personal profile, schedule, and self-service operations"
      >
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-600">
            Loading your employee profile...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (errorMessage || !employee) {
    return (
      <PageContainer
        title="Employee Self-Service Portal"
        description="Personal profile, schedule, and self-service operations"
      >
        <div className="py-16 text-center max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            No Linked Employee Profile
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {errorMessage ||
              "Your user account is not currently linked to an active employee record. Please contact your HR Manager or Administrator."}
          </p>
        </div>
      </PageContainer>
    );
  }

  const quickLinks = [
    {
      title: "My Attendance",
      description: "Log daily attendance & check-in history",
      icon: CalendarCheck,
      path: "/attendance",
      color: "emerald",
    },
    {
      title: "My Leave Requests",
      description: "Apply for leaves & track approval status",
      icon: CalendarDays,
      path: "/time-off/requests",
      color: "amber",
    },
    {
      title: "My Salary Payslips",
      description: "View and download monthly payslip PDFs",
      icon: FileSpreadsheet,
      path: "/payroll/payslips",
      color: "indigo",
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-600 text-white";
      case "amber":
        return "bg-amber-600 text-white";
      case "indigo":
        return "bg-indigo-600 text-white";
      default:
        return "bg-slate-700 text-white";
    }
  };

  return (
    <PageContainer
      title="Employee Self-Service Portal"
      description="Personal profile, assigned work schedule, banking data, and self-service requests"
      breadcrumbs={[{ label: "My Profile" }]}
    >
      <div className="space-y-6">
        {/* 1. EMPLOYEE PROFILE SECTION */}
        <EmployeeProfileHeader employee={employee} isSelfView={true} />

        {/* 2. SMART ATTENDANCE CONSOLE */}
        <AttendanceWidget />

        {/* 3. SELF-SERVICE OPERATIONAL PORTALS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Self-Service Operational Portals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-all duration-150 shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${getColorClasses(
                        item.color
                      )}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. LEAVE QUOTA & BALANCES */}
        <LeaveBalanceCard
          employeeId={employee._id}
          onRequestLeave={() => navigate("/time-off/requests")}
        />

        {/* 5. BOTTOM INFORMATION SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Organization & Schedule */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Workforce Assignment
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-semibold text-slate-900">
                  {employee.department?.name || <span className="text-slate-400 italic">Unassigned</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Job Position</span>
                <span className="font-semibold text-slate-900">
                  {employee.jobPosition?.name || <span className="text-slate-400 italic">Unassigned</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Reporting Manager</span>
                <span className="font-semibold text-slate-900">
                  {employee.manager ? (
                    `${employee.manager.fullName} (${employee.manager.employeeCode})`
                  ) : (
                    <span className="text-slate-400 italic">None (Top Level)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Working Schedule</span>
                <span className="font-semibold text-slate-900">
                  {employee.workingSchedule?.name || <span className="text-slate-400 italic">Standard Schedule</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Employment Type</span>
                <span className="font-semibold text-slate-900">
                  {employee.employeeType || "Full-Time"}
                </span>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Disbursement Account Details
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Bank Name</span>
                <span className="font-semibold text-slate-900">
                  {employee.bankDetails?.bankName || (
                    <span className="text-slate-400 italic">Not Provided</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Account Number</span>
                <span className="font-mono font-semibold text-slate-900">
                  {employee.bankDetails?.accountNumber
                    ? `****${employee.bankDetails.accountNumber.slice(-4)}`
                    : "Not Provided"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">IFSC / Routing / Swift</span>
                <span className="font-mono font-semibold text-slate-900">
                  {employee.bankDetails?.ifscOrRoutingCode || (
                    <span className="text-slate-400 italic">Not Provided</span>
                  )}
                </span>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
                To update your disbursement details, please submit a formal request to HR Administration.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
