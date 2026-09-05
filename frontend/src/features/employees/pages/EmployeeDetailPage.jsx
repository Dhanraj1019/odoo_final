import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  User,
  CheckCircle2,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import EmployeeProfileHeader from "../components/EmployeeProfileHeader";
import RelatedRecordsTabs from "../components/RelatedRecordsTabs";
import EmployeeFormModal from "../components/EmployeeFormModal";
import TerminateModal from "../components/TerminateModal";
import employeesApi from "../../../api/employees";
import referencesApi from "../../../api/references";

export default function EmployeeDetailPage() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [candidateEmployees, setCandidateEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [showAccountSecret, setShowAccountSecret] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [empRes, allEmpRes, deptRes, posRes, schRes] = await Promise.all([
        employeesApi.getEmployeeById(id),
        employeesApi.listEmployees(),
        referencesApi.listDepartments(),
        referencesApi.listJobPositions(),
        referencesApi.listWorkingSchedules(),
      ]);

      if (empRes.ok && (empRes.data?.employee || empRes.employee)) {
        setEmployee(empRes.data?.employee || empRes.employee);
      } else {
        setErrorMessage(empRes.message || "Employee record not found");
      }

      if (allEmpRes.ok && (allEmpRes.data?.employees || allEmpRes.employees)) {
        setCandidateEmployees(allEmpRes.data?.employees || allEmpRes.employees || []);
      }
      if (deptRes.ok && (deptRes.data?.departments || deptRes.departments)) {
        setDepartments(deptRes.data?.departments || deptRes.departments || []);
      }
      if (posRes.ok && (posRes.data?.jobPositions || posRes.jobPositions)) {
        setJobPositions(posRes.data?.jobPositions || posRes.jobPositions || []);
      }
      if (schRes.ok && (schRes.data?.workingSchedules || schRes.workingSchedules)) {
        setWorkingSchedules(schRes.data?.workingSchedules || schRes.workingSchedules || []);
      }
    } catch (err) {
      console.error("Failed to load employee details:", err);
      setErrorMessage(err.message || "Failed to load employee");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  if (isLoading) {
    return (
      <PageContainer title="Employee Profile" breadcrumbs={[{ label: "Employees", path: "/employees" }]}>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-600">Loading employee master record...</p>
        </div>
      </PageContainer>
    );
  }

  if (errorMessage || !employee) {
    return (
      <PageContainer title="Employee Not Found" breadcrumbs={[{ label: "Employees", path: "/employees" }]}>
        <div className="py-16 text-center max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Employee Record Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{errorMessage || "The requested employee does not exist or has been removed."}</p>
          <Link
            to="/employees"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employee Directory
          </Link>
        </div>
      </PageContainer>
    );
  }

  const maskAccountNumber = (acc = "") => {
    if (!acc) return "Not Provided";
    if (showAccountSecret) return acc;
    if (acc.length <= 4) return "****";
    return "*".repeat(acc.length - 4) + acc.slice(-4);
  };

  return (
    <PageContainer
      title={employee.fullName}
      description={`Master record for employee code ${employee.employeeCode}`}
      breadcrumbs={[
        { label: "Employees", path: "/employees" },
        { label: employee.fullName },
      ]}
    >
      <div className="space-y-6">
        {/* Profile Header Card */}
        <EmployeeProfileHeader
          employee={employee}
          onEdit={() => setIsEditModalOpen(true)}
          onTerminate={() => setIsTerminateModalOpen(true)}
        />

        {/* Related Operations Quick Links */}
        <RelatedRecordsTabs employee={employee} />

        {/* Detailed Information Tabs / Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Panel 1: Organization & Contractual Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Organization & Hierarchy
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
                    <Link
                      to={`/employees/${employee.manager._id}`}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {employee.manager.fullName} ({employee.manager.employeeCode})
                    </Link>
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

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Employment Type</span>
                <span className="font-semibold text-slate-900">
                  {employee.employeeType || "Full-Time"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Record Created</span>
                <span className="font-semibold text-slate-700">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Last Updated</span>
                <span className="font-semibold text-slate-700">
                  {new Date(employee.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 2: Banking & Payroll Information */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Disbursement & Banking Details
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
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900">
                    {maskAccountNumber(employee.bankDetails?.accountNumber)}
                  </span>
                  {employee.bankDetails?.accountNumber && (
                    <button
                      type="button"
                      onClick={() => setShowAccountSecret((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title={showAccountSecret ? "Hide Account Number" : "Show Account Number"}
                    >
                      {showAccountSecret ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">IFSC / Routing / Swift</span>
                <span className="font-mono font-semibold text-slate-900">
                  {employee.bankDetails?.ifscOrRoutingCode || (
                    <span className="text-slate-400 italic">Not Provided</span>
                  )}
                </span>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
                Bank credentials are securely stored and referenced during salary payrun disbursement execution.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <EmployeeFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={employee}
        onSuccess={(updated) => {
          setEmployee(updated);
        }}
        departments={departments}
        jobPositions={jobPositions}
        workingSchedules={workingSchedules}
        candidateEmployees={candidateEmployees}
      />

      {/* Terminate Confirmation Modal */}
      <TerminateModal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        employee={employee}
        onSuccess={(updated) => {
          setEmployee(updated);
        }}
      />
    </PageContainer>
  );
}
