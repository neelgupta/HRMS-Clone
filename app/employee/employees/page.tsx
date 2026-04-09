"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { EmployeeLayout } from "@/components/employee";
import { EmployeeCard } from "@/components/employees/employee-card";
import { FilterSection } from "@/components/employees/filter-section";
import { fetchEmployees, type EmployeeListItem } from "@/lib/client/employee";
import { PageLoader } from "@/components/ui/loader";

function EmployeesContent() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");

  // Fetch employees
  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        const result = await fetchEmployees({
          search: searchTerm,
          department: selectedDepartment,
          designation: selectedDesignation,
          employmentType: selectedEmploymentType,
          page: 1,
          limit: 1000, // Get all employees for alphabetical grouping
        });
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setEmployees(result.data.employees);
        }
      } catch (err) {
        setError("Failed to load employees");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [searchTerm, selectedDepartment, selectedDesignation, selectedEmploymentType]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const designations = [...new Set(employees.map(e => e.designation).filter(Boolean))];
    const locations = [...new Set(employees.map(e => e.branch?.name).filter(Boolean))];
    const employmentTypes = [...new Set(employees.map(e => e.employmentType).filter(Boolean))];
    
    return { departments, designations, locations, employmentTypes };
  }, [employees]);

  // Group employees alphabetically by last name
  const groupedEmployees = useMemo(() => {
    const filtered = employees.filter(employee => {
      const matchesSearch = !searchTerm || 
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
      const matchesDesignation = !selectedDesignation || employee.designation === selectedDesignation;
      const matchesLocation = !selectedLocation || employee.branch?.name === selectedLocation;
      const matchesEmploymentType = !selectedEmploymentType || employee.employmentType === selectedEmploymentType;
      
      return matchesSearch && matchesDepartment && matchesDesignation && matchesLocation && matchesEmploymentType;
    });

    const groups: Record<string, EmployeeListItem[]> = {};
    
    filtered.forEach(employee => {
      const firstLetter = employee.lastName.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(employee);
    });

    // Sort each group alphabetically by last name, then first name
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });
    });

    return groups;
  }, [employees, searchTerm, selectedDepartment, selectedDesignation, selectedLocation, selectedEmploymentType]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedDesignation={selectedDesignation}
        onDesignationChange={setSelectedDesignation}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        selectedEmploymentType={selectedEmploymentType}
        onEmploymentTypeChange={setSelectedEmploymentType}
        departments={filterOptions.departments}
        designations={filterOptions.designations}
        locations={filterOptions.locations}
        employmentTypes={filterOptions.employmentTypes}
      />

      {/* Employee Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {Object.values(groupedEmployees).reduce((sum, group) => sum + group.length, 0)} employees
      </div>

      {/* Employee Cards Grouped Alphabetically */}
      {Object.keys(groupedEmployees).length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">No employees found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEmployees)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, employeeGroup]) => (
              <div key={letter}>
                {/* Letter Header */}
                <div className="flex items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{letter}</h2>
                  <div className="ml-4 h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* Employee Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {employeeGroup.map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <EmployeeLayout title="Employee Directory" subtitle="View your colleagues and team members">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <EmployeesContent />
      </Suspense>
    </EmployeeLayout>
  );
}
