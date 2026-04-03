"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySetupForm = CompanySetupForm;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var Yup = require("yup");
var md_1 = require("react-icons/md");
var company_1 = require("@/lib/validations/company");
var company_defaults_1 = require("@/lib/company-defaults");
var company_2 = require("@/lib/client/company");
var skeleton_1 = require("@/components/ui/loaders/skeleton");
var spinner_1 = require("@/components/ui/loaders/spinner");
var form_field_1 = require("@/components/ui/form-field");
var select_input_1 = require("@/components/ui/select-input");
var text_input_1 = require("@/components/ui/text-input");
var toggle_field_1 = require("@/components/ui/toggle-field");
var upload_field_1 = require("@/components/company-setup/upload-field");
var toast_1 = require("@/lib/toast");
var steps = [
    "Company Info",
    "Addresses",
    "Branches",
    "Bank Details",
    "Settings",
    "Custom Fields",
];
var addressSchema = Yup.object().shape({
    type: Yup.string().oneOf(["HEAD_OFFICE", "BRANCH"]).required(),
    label: Yup.string().max(255),
    addressLine1: Yup.string().min(2, "Address line 1 is required.").required(),
    addressLine2: Yup.string().max(255),
    city: Yup.string().min(2, "City is required.").required(),
    state: Yup.string().min(2, "State is required.").required(),
    country: Yup.string().min(2, "Country is required.").required(),
    pincode: Yup.string().min(4, "Pincode is required.").required(),
});
var branchSchema = Yup.object().shape({
    name: Yup.string().min(2, "Branch name is required.").required(),
    contactEmail: Yup.string().email("Enter a valid email address."),
    contactPhone: Yup.string().max(255),
    addressLine1: Yup.string().min(2, "Address line 1 is required.").required(),
    addressLine2: Yup.string().max(255),
    city: Yup.string().min(2, "City is required.").required(),
    state: Yup.string().min(2, "State is required.").required(),
    country: Yup.string().min(2, "Country is required.").required(),
    pincode: Yup.string().min(4, "Pincode is required.").required(),
});
var bankDetailSchema = Yup.object().shape({
    bankName: Yup.string().min(2, "Bank name is required.").required(),
    accountHolderName: Yup.string()
        .min(2, "Account holder name is required.")
        .required(),
    accountNumber: Yup.string()
        .min(6, "Account number is required.")
        .required(),
    ifscCode: Yup.string().min(4, "IFSC code is required.").required(),
    branchName: Yup.string().min(2, "Branch name is required.").required(),
});
var employeeCustomFieldSchema = Yup.object().shape({
    fieldName: Yup.string().min(2, "Field name is required.").required(),
    fieldType: Yup.string()
        .oneOf(["TEXT", "NUMBER", "DATE", "DROPDOWN", "CHECKBOX"])
        .required(),
    required: Yup.boolean(),
    options: Yup.array().of(Yup.string().required()),
});
var generalSettingSchema = Yup.object().shape({
    currency: Yup.string()
        .oneOf(["INR", "USD", "EUR", "GBP", "AED", "SGD"])
        .required(),
    dateFormat: Yup.string()
        .oneOf(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"])
        .required(),
    timeZone: Yup.string()
        .oneOf([
        "Asia/Kolkata",
        "Asia/Dubai",
        "Europe/London",
        "America/New_York",
        "Asia/Singapore",
    ])
        .required(),
    workweek: Yup.string().oneOf(["MON_FRI", "MON_SAT"]).required(),
    holidayList: Yup.array().of(Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")),
    emailNotifications: Yup.boolean().required(),
});
var validationSchema = Yup.object().shape({
    companyName: Yup.string().min(2, "Company name is required.").required(),
    logoUrl: Yup.string().max(255).default(""),
    iconUrl: Yup.string().max(255).default(""),
    industry: Yup.string()
        .oneOf([
        "Information Technology",
        "Manufacturing",
        "Healthcare",
        "Education",
        "Finance",
        "Retail",
        "Consulting",
        "Logistics",
        "Real Estate",
        "Hospitality",
    ])
        .required(),
    registrationNumber: Yup.string().max(255),
    panNumber: Yup.string().max(255),
    tanNumber: Yup.string().max(255),
    gstNumber: Yup.string().max(255),
    companyStartDate: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
    fiscalYearStart: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
    fiscalYearEnd: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
    primaryEmail: Yup.string().email("Enter a valid email address."),
    primaryPhone: Yup.string().max(255),
    website: Yup.string().matches(/^https?:\/\/.+/i, "Must start with http:// or https://"),
    addresses: Yup.array().of(addressSchema).min(1, "Add at least one address."),
    branches: Yup.array().of(branchSchema).default([]),
    bankDetail: bankDetailSchema,
    generalSetting: generalSettingSchema,
    employeeCustomFields: Yup.array().of(employeeCustomFieldSchema).default([]),
});
function CompanySetupForm() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    var router = (0, navigation_1.useRouter)();
    var _u = (0, react_1.useState)(0), currentStep = _u[0], setCurrentStep = _u[1];
    var _v = (0, react_1.useState)(true), loading = _v[0], setLoading = _v[1];
    var _w = (0, react_1.useState)(""), pageError = _w[0], setPageError = _w[1];
    var _x = (0, react_1.useState)(null), user = _x[0], setUser = _x[1];
    var _y = (0, react_1.useState)(false), companyExists = _y[0], setCompanyExists = _y[1];
    var _z = (0, react_1.useState)(""), holidayInput = _z[0], setHolidayInput = _z[1];
    var _0 = (0, react_1.useState)(function () {
        return (0, company_defaults_1.getDefaultCompanySetupValues)();
    }), formValues = _0[0], setFormValues = _0[1];
    var _1 = (0, react_1.useState)({}), formErrors = _1[0], setFormErrors = _1[1];
    var _2 = (0, react_1.useState)({}), touched = _2[0], setTouched = _2[1];
    var _3 = (0, react_1.useState)(false), isSubmitting = _3[0], setIsSubmitting = _3[1];
    var formik = {
        values: formValues,
        errors: formErrors,
        touched: touched,
        isSubmitting: isSubmitting,
        handleChange: function (e) {
            var _a = e.target, name = _a.name, value = _a.value;
            setFormValues(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
            setTouched(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = true, _a)));
            });
        },
        handleBlur: function (e) {
            setTouched(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[e.target.name] = true, _a)));
            });
        },
        setFieldValue: function (name, value) {
            setFormValues(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        },
        setFieldTouched: function (name, isTouched) {
            if (isTouched === void 0) { isTouched = true; }
            setTouched(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = isTouched, _a)));
            });
        },
        resetForm: function (values) {
            if (values) {
                setFormValues(values);
            }
            else {
                setFormValues((0, company_defaults_1.getDefaultCompanySetupValues)());
            }
            setFormErrors({});
            setTouched({});
        },
        validateForm: function () { return __awaiter(_this, void 0, void 0, function () {
            var err_1, errors_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, validationSchema.validate(formValues, { abortEarly: false })];
                    case 1:
                        _a.sent();
                        setFormErrors({});
                        return [2 /*return*/, {}];
                    case 2:
                        err_1 = _a.sent();
                        if (err_1 instanceof Yup.ValidationError) {
                            errors_1 = {};
                            err_1.inner.forEach(function (e) {
                                if (e.path) {
                                    errors_1[e.path] = e.message;
                                }
                            });
                            setFormErrors(errors_1);
                            return [2 /*return*/, errors_1];
                        }
                        return [2 /*return*/, {}];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        submitForm: function () { return __awaiter(_this, void 0, void 0, function () {
            var errors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, formik.validateForm()];
                    case 1:
                        errors = _a.sent();
                        if (Object.keys(errors).length === 0) {
                            return [2 /*return*/, formValues];
                        }
                        return [2 /*return*/, null];
                }
            });
        }); },
    };
    var getNestedValue = function (obj, path) {
        return path.split(".").reduce(function (acc, part) {
            if (acc && typeof acc === "object") {
                return acc[part];
            }
            return undefined;
        }, obj);
    };
    var setNestedValue = function (obj, path, value) {
        var parts = path.split(".");
        var result = Array.isArray(obj) ? __spreadArray([], obj, true) : __assign({}, obj);
        var current = result;
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            var next = current;
            current = Array.isArray(next[part])
                ? __spreadArray([], next[part], true) : __assign({}, next[part]);
            current[part] = current;
        }
        var lastPart = parts[parts.length - 1];
        current[lastPart] = value;
        return result;
    };
    var handleArrayFieldChange = function (index, field, value) {
        var path = "".concat(field, "[").concat(index, "]");
        setFormValues(function (prev) {
            var _a, _b;
            var current = getNestedValue(prev, field);
            var updated = __spreadArray([], current, true);
            updated[index] = __assign(__assign({}, updated[index]), (_a = {}, _a[path.split(".").pop()] = value, _a));
            return __assign(__assign({}, prev), (_b = {}, _b[field] = updated, _b));
        });
        setTouched(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[path] = true, _a)));
        });
    };
    var addresses = {
        fields: formValues.addresses,
        append: function (value) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { addresses: __spreadArray(__spreadArray([], prev.addresses, true), [value], false) })); });
        },
        remove: function (index) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { addresses: prev.addresses.filter(function (_, i) { return i !== index; }) })); });
        },
    };
    var branches = {
        fields: formValues.branches,
        append: function (value) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { branches: __spreadArray(__spreadArray([], prev.branches, true), [value], false) })); });
        },
        remove: function (index) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { branches: prev.branches.filter(function (_, i) { return i !== index; }) })); });
        },
    };
    var customFields = {
        fields: formValues.employeeCustomFields,
        append: function (value) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { employeeCustomFields: __spreadArray(__spreadArray([], prev.employeeCustomFields, true), [value], false) })); });
        },
        remove: function (index) {
            setFormValues(function (prev) { return (__assign(__assign({}, prev), { employeeCustomFields: prev.employeeCustomFields.filter(function (_, i) { return i !== index; }) })); });
        },
    };
    var holidayList = formValues.generalSetting.holidayList;
    var watchedCustomFields = formValues.employeeCustomFields;
    (0, react_1.useEffect)(function () {
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, userData, companyData, _b, message;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 2, 3, 4]);
                            return [4 /*yield*/, Promise.all([
                                    (0, company_2.fetchCurrentUser)(),
                                    (0, company_2.fetchCompanySetup)(),
                                ])];
                        case 1:
                            _a = _d.sent(), userData = _a[0], companyData = _a[1];
                            setUser(userData);
                            if (companyData.company) {
                                setCompanyExists(true);
                                setFormValues(companyData.company.values);
                            }
                            else {
                                setFormValues((0, company_defaults_1.getDefaultCompanySetupValues)(((_c = userData.company) === null || _c === void 0 ? void 0 : _c.name) || ""));
                            }
                            return [3 /*break*/, 4];
                        case 2:
                            _b = _d.sent();
                            message = "Could not load company setup.";
                            setPageError(message);
                            (0, toast_1.showError)(message);
                            return [3 /*break*/, 4];
                        case 3:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        void load();
    }, []);
    function submitForm(mode) {
        return __awaiter(this, void 0, void 0, function () {
            var rawValues, payload, toastId, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsSubmitting(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, formik.submitForm()];
                    case 2:
                        rawValues = _a.sent();
                        if (!rawValues) {
                            setIsSubmitting(false);
                            return [2 /*return*/];
                        }
                        payload = __assign(__assign({}, rawValues), { markSetupComplete: mode === "complete" });
                        toastId = (0, toast_1.showLoading)(mode === "complete" ? "Saving company settings..." : "Saving draft...");
                        return [4 /*yield*/, (0, company_2.saveCompanySetup)(payload, companyExists)];
                    case 3:
                        data = _a.sent();
                        setCompanyExists(true);
                        (0, toast_1.dismissToast)(toastId);
                        (0, toast_1.showSuccess)(data.message || "Saved successfully.");
                        if (data.company) {
                            setFormValues(data.company.values);
                        }
                        (0, react_1.startTransition)(function () { return router.refresh(); });
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof Error && error_1.message === "Unauthorized.") {
                            router.push("/login");
                            return [2 /*return*/];
                        }
                        (0, toast_1.showError)(error_1 instanceof Error
                            ? error_1.message
                            : "Could not save company settings.");
                        return [3 /*break*/, 6];
                    case 5:
                        setIsSubmitting(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function addHoliday() {
        if (!holidayInput) {
            return;
        }
        if (holidayList.includes(holidayInput)) {
            setHolidayInput("");
            return;
        }
        setFormValues(function (prev) { return (__assign(__assign({}, prev), { generalSetting: __assign(__assign({}, prev.generalSetting), { holidayList: __spreadArray(__spreadArray([], prev.generalSetting.holidayList, true), [holidayInput], false) }) })); });
        setHolidayInput("");
    }
    function getError(path) {
        var error = formErrors[path];
        var isTouched = touched[path];
        return isTouched ? error : undefined;
    }
    if (loading) {
        return (<div className="animate-[loaderFadeIn_220ms_ease-out] space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
          <skeleton_1.Skeleton className="h-4 w-32"/>
          <skeleton_1.Skeleton className="mt-4 h-10 w-2/3"/>
          <skeleton_1.Skeleton className="mt-3 h-4 w-full"/>
          <skeleton_1.Skeleton className="mt-2 h-4 w-4/5"/>
        </div>
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
            <div className="space-y-3">
              <skeleton_1.Skeleton className="h-14 w-full"/>
              <skeleton_1.Skeleton className="h-14 w-full"/>
              <skeleton_1.Skeleton className="h-14 w-full"/>
              <skeleton_1.Skeleton className="h-14 w-full"/>
            </div>
          </aside>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
            <div className="grid gap-6 md:grid-cols-2">
              <skeleton_1.Skeleton className="h-24 w-full"/>
              <skeleton_1.Skeleton className="h-24 w-full"/>
              <skeleton_1.Skeleton className="h-24 w-full"/>
              <skeleton_1.Skeleton className="h-24 w-full"/>
            </div>
          </div>
        </div>
      </div>);
    }
    if (!user) {
        return (<div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
        {pageError || "Unauthorized"}
      </div>);
    }
    return (<>
      <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-400">
              Company Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              Configure {formValues.companyName || ((_a = user.company) === null || _a === void 0 ? void 0 : _a.name)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Build the core operating profile for your HR workspace. Save a
              draft anytime, or complete setup once the essentials are in place.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:text-indigo-400">
            <p className="font-medium">HR Admin: {user.name}</p>
            <p className="mt-1 text-indigo-500 dark:text-indigo-500">
              {companyExists
            ? "Existing company profile loaded"
            : "Starting a fresh company profile"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
          <div className="space-y-2">
            {steps.map(function (step, index) {
            var isActive = currentStep === index;
            var isComplete = index < currentStep;
            return (<button key={step} type="button" onClick={function () { return setCurrentStep(index); }} className={"flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ".concat(isActive
                    ? "bg-indigo-50 text-slate-950 ring-1 ring-indigo-100 dark:bg-indigo-900/30 dark:text-white dark:ring-indigo-800"
                    : "bg-slate-50 text-slate-700 hover:bg-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600")}>
                  <span className={"flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ".concat(isActive
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                    : isComplete
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300")}>
                    {isComplete ? "✓" : index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </button>);
        })}
          </div>
        </aside>

        <form onSubmit={function (event) {
            event.preventDefault();
        }} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
          {pageError ? (<div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
              {pageError}
            </div>) : null}

          {currentStep === 0 ? (<section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <form_field_1.FormField label="Company Name" error={getError("companyName")} required>
                  <text_input_1.TextInput name="companyName" value={formValues.companyName} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="WorkNest Technologies Pvt Ltd"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="Industry" error={getError("industry")} required>
                  <select_input_1.SelectInput name="industry" value={formValues.industry} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    {company_1.COMPANY_INDUSTRY_OPTIONS.map(function (industry) { return (<option key={industry} value={industry}>
                        {industry}
                      </option>); })}
                  </select_input_1.SelectInput>
                </form_field_1.FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <upload_field_1.UploadField label="Company Logo" value={(_b = formValues.logoUrl) !== null && _b !== void 0 ? _b : ""} onUploaded={function (url) {
                formik.setFieldValue("logoUrl", url);
                formik.setFieldTouched("logoUrl", true);
            }}/>
                <upload_field_1.UploadField label="Company Icon" value={(_c = formValues.iconUrl) !== null && _c !== void 0 ? _c : ""} onUploaded={function (url) {
                formik.setFieldValue("iconUrl", url);
                formik.setFieldTouched("iconUrl", true);
            }}/>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <form_field_1.FormField label="Registration Number" error={getError("registrationNumber")}>
                  <text_input_1.TextInput name="registrationNumber" value={(_d = formValues.registrationNumber) !== null && _d !== void 0 ? _d : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="U74999KA2026PTC000123"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="PAN Number" error={getError("panNumber")}>
                  <text_input_1.TextInput name="panNumber" value={(_e = formValues.panNumber) !== null && _e !== void 0 ? _e : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="ABCDE1234F"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="TAN Number" error={getError("tanNumber")}>
                  <text_input_1.TextInput name="tanNumber" value={(_f = formValues.tanNumber) !== null && _f !== void 0 ? _f : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="BLRA12345B"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="GST Number" error={getError("gstNumber")}>
                  <text_input_1.TextInput name="gstNumber" value={(_g = formValues.gstNumber) !== null && _g !== void 0 ? _g : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="29ABCDE1234F1Z5"/>
                </form_field_1.FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <form_field_1.FormField label="Company Start Date" error={getError("companyStartDate")}>
                  <text_input_1.TextInput type="date" name="companyStartDate" value={(_h = formValues.companyStartDate) !== null && _h !== void 0 ? _h : ""} onChange={formik.handleChange} onBlur={formik.handleBlur}/>
                </form_field_1.FormField>
                <form_field_1.FormField label="Fiscal Year Start" error={getError("fiscalYearStart")}>
                  <text_input_1.TextInput type="date" name="fiscalYearStart" value={(_j = formValues.fiscalYearStart) !== null && _j !== void 0 ? _j : ""} onChange={formik.handleChange} onBlur={formik.handleBlur}/>
                </form_field_1.FormField>
                <form_field_1.FormField label="Fiscal Year End" error={getError("fiscalYearEnd")}>
                  <text_input_1.TextInput type="date" name="fiscalYearEnd" value={(_k = formValues.fiscalYearEnd) !== null && _k !== void 0 ? _k : ""} onChange={formik.handleChange} onBlur={formik.handleBlur}/>
                </form_field_1.FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <form_field_1.FormField label="Primary Email" error={getError("primaryEmail")}>
                  <text_input_1.TextInput type="email" name="primaryEmail" value={(_l = formValues.primaryEmail) !== null && _l !== void 0 ? _l : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="hr@worknest.com"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="Primary Phone" error={getError("primaryPhone")}>
                  <text_input_1.TextInput name="primaryPhone" value={(_m = formValues.primaryPhone) !== null && _m !== void 0 ? _m : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="+91 98765 43210"/>
                </form_field_1.FormField>
                <form_field_1.FormField label="Website" error={getError("website")}>
                  <text_input_1.TextInput name="website" value={(_o = formValues.website) !== null && _o !== void 0 ? _o : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="https://worknest.com"/>
                </form_field_1.FormField>
              </div>
            </section>) : null}

          {currentStep === 1 ? (<section className="space-y-5">
              {addresses.fields.map(function (address, index) {
                var _a, _b, _c, _d, _e, _f, _g;
                return (<div key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Address {index + 1}
                    </h2>
                    {addresses.fields.length > 1 ? (<button type="button" onClick={function () { return addresses.remove(index); }} className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400">
                        Remove
                      </button>) : null}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <form_field_1.FormField label="Address Type" error={getError("addresses.".concat(index, ".type"))} required>
                      <select_input_1.SelectInput name={"addresses.".concat(index, ".type")} value={address.type} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur}>
                        <option value="HEAD_OFFICE">Head Office</option>
                        <option value="BRANCH">Branch</option>
                      </select_input_1.SelectInput>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Label" error={getError("addresses.".concat(index, ".label"))}>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".label")} value={(_a = address.label) !== null && _a !== void 0 ? _a : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="Corporate HQ"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Address Line 1" error={getError("addresses.".concat(index, ".addressLine1"))} required>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".addressLine1")} value={(_b = address.addressLine1) !== null && _b !== void 0 ? _b : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="Building, street, area"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Address Line 2" error={getError("addresses.".concat(index, ".addressLine2"))}>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".addressLine2")} value={(_c = address.addressLine2) !== null && _c !== void 0 ? _c : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="Landmark or suite"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="City" error={getError("addresses.".concat(index, ".city"))} required>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".city")} value={(_d = address.city) !== null && _d !== void 0 ? _d : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="State" error={getError("addresses.".concat(index, ".state"))} required>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".state")} value={(_e = address.state) !== null && _e !== void 0 ? _e : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Country" error={getError("addresses.".concat(index, ".country"))} required>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".country")} value={(_f = address.country) !== null && _f !== void 0 ? _f : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Pincode" error={getError("addresses.".concat(index, ".pincode"))} required>
                      <text_input_1.TextInput name={"addresses.".concat(index, ".pincode")} value={(_g = address.pincode) !== null && _g !== void 0 ? _g : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "addresses", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                  </div>
                </div>);
            })}

              <button type="button" onClick={function () {
                return addresses.append({
                    type: "BRANCH",
                    label: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                });
            }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400">
                <md_1.MdAdd className="text-base"/>
                Add Address
              </button>
            </section>) : null}

          {currentStep === 2 ? (<section className="space-y-5">
              {branches.fields.length === 0 ? (<div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                  No branches added yet. Add branches now or come back later.
                </div>) : null}

              {branches.fields.map(function (branch, index) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                return (<div key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Branch {index + 1}
                    </h2>
                    <button type="button" onClick={function () { return branches.remove(index); }} className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400">
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <form_field_1.FormField label="Branch Name" error={getError("branches.".concat(index, ".name"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".name")} value={(_a = branch.name) !== null && _a !== void 0 ? _a : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="Bengaluru Branch"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Contact Email" error={getError("branches.".concat(index, ".contactEmail"))}>
                      <text_input_1.TextInput type="email" name={"branches.".concat(index, ".contactEmail")} value={(_b = branch.contactEmail) !== null && _b !== void 0 ? _b : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="blr@company.com"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Contact Phone" error={getError("branches.".concat(index, ".contactPhone"))}>
                      <text_input_1.TextInput name={"branches.".concat(index, ".contactPhone")} value={(_c = branch.contactPhone) !== null && _c !== void 0 ? _c : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="+91 91234 56789"/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Address Line 1" error={getError("branches.".concat(index, ".addressLine1"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".addressLine1")} value={(_d = branch.addressLine1) !== null && _d !== void 0 ? _d : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Address Line 2" error={getError("branches.".concat(index, ".addressLine2"))}>
                      <text_input_1.TextInput name={"branches.".concat(index, ".addressLine2")} value={(_e = branch.addressLine2) !== null && _e !== void 0 ? _e : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="City" error={getError("branches.".concat(index, ".city"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".city")} value={(_f = branch.city) !== null && _f !== void 0 ? _f : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="State" error={getError("branches.".concat(index, ".state"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".state")} value={(_g = branch.state) !== null && _g !== void 0 ? _g : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Country" error={getError("branches.".concat(index, ".country"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".country")} value={(_h = branch.country) !== null && _h !== void 0 ? _h : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                    <form_field_1.FormField label="Pincode" error={getError("branches.".concat(index, ".pincode"))} required>
                      <text_input_1.TextInput name={"branches.".concat(index, ".pincode")} value={(_j = branch.pincode) !== null && _j !== void 0 ? _j : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "branches", e.target.value);
                    }} onBlur={formik.handleBlur}/>
                    </form_field_1.FormField>
                  </div>
                </div>);
            })}

              <button type="button" onClick={function () {
                return branches.append({
                    name: "",
                    contactEmail: "",
                    contactPhone: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                });
            }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400">
                <md_1.MdAdd className="text-base"/>
                Add Branch
              </button>
            </section>) : null}

          {currentStep === 3 ? (<section className="grid gap-6 md:grid-cols-2">
              <form_field_1.FormField label="Bank Name" error={getError("bankDetail.bankName")} required>
                <text_input_1.TextInput name="bankDetail.bankName" value={(_p = formValues.bankDetail.bankName) !== null && _p !== void 0 ? _p : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="HDFC Bank"/>
              </form_field_1.FormField>
              <form_field_1.FormField label="Account Holder Name" error={getError("bankDetail.accountHolderName")} required>
                <text_input_1.TextInput name="bankDetail.accountHolderName" value={(_q = formValues.bankDetail.accountHolderName) !== null && _q !== void 0 ? _q : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="WorkNest Technologies Pvt Ltd"/>
              </form_field_1.FormField>
              <form_field_1.FormField label="Account Number" error={getError("bankDetail.accountNumber")} required>
                <text_input_1.TextInput name="bankDetail.accountNumber" value={(_r = formValues.bankDetail.accountNumber) !== null && _r !== void 0 ? _r : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="50200012345678"/>
              </form_field_1.FormField>
              <form_field_1.FormField label="IFSC Code" error={getError("bankDetail.ifscCode")} required>
                <text_input_1.TextInput name="bankDetail.ifscCode" value={(_s = formValues.bankDetail.ifscCode) !== null && _s !== void 0 ? _s : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="HDFC0000123"/>
              </form_field_1.FormField>
              <form_field_1.FormField label="Branch Name" error={getError("bankDetail.branchName")} required>
                <text_input_1.TextInput name="bankDetail.branchName" value={(_t = formValues.bankDetail.branchName) !== null && _t !== void 0 ? _t : ""} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="Koramangala"/>
              </form_field_1.FormField>
            </section>) : null}

          {currentStep === 4 ? (<section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <form_field_1.FormField label="Currency" error={getError("generalSetting.currency")} required>
                  <select_input_1.SelectInput name="generalSetting.currency" value={formValues.generalSetting.currency} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    {company_1.COMPANY_CURRENCY_OPTIONS.map(function (currency) { return (<option key={currency} value={currency}>
                        {currency}
                      </option>); })}
                  </select_input_1.SelectInput>
                </form_field_1.FormField>
                <form_field_1.FormField label="Date Format" error={getError("generalSetting.dateFormat")} required>
                  <select_input_1.SelectInput name="generalSetting.dateFormat" value={formValues.generalSetting.dateFormat} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    {company_1.COMPANY_DATE_FORMAT_OPTIONS.map(function (format) { return (<option key={format} value={format}>
                        {format}
                      </option>); })}
                  </select_input_1.SelectInput>
                </form_field_1.FormField>
                <form_field_1.FormField label="Time Zone" error={getError("generalSetting.timeZone")} required>
                  <select_input_1.SelectInput name="generalSetting.timeZone" value={formValues.generalSetting.timeZone} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    {company_1.COMPANY_TIME_ZONE_OPTIONS.map(function (timeZone) { return (<option key={timeZone} value={timeZone}>
                        {timeZone}
                      </option>); })}
                  </select_input_1.SelectInput>
                </form_field_1.FormField>
                <form_field_1.FormField label="Workweek" error={getError("generalSetting.workweek")} required>
                  <select_input_1.SelectInput name="generalSetting.workweek" value={formValues.generalSetting.workweek} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                    <option value="MON_FRI">Mon-Fri</option>
                    <option value="MON_SAT">Mon-Sat</option>
                  </select_input_1.SelectInput>
                </form_field_1.FormField>
              </div>

              <toggle_field_1.ToggleField checked={formValues.generalSetting.emailNotifications} onChange={function (checked) {
                formik.setFieldValue("generalSetting.emailNotifications", checked);
                formik.setFieldTouched("generalSetting.emailNotifications", true);
            }} label="Email Notifications" description="Keep company-wide HR alerts and workflow emails enabled."/>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <form_field_1.FormField label="Holiday List" hint="Add one holiday date at a time.">
                      <text_input_1.TextInput type="date" value={holidayInput} onChange={function (event) {
                return setHolidayInput(event.target.value);
            }}/>
                    </form_field_1.FormField>
                  </div>
                  <button type="button" onClick={addHoliday} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400">
                    <md_1.MdAdd className="text-base"/>
                    Add Holiday
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {holidayList.length === 0 ? (<p className="text-sm text-slate-400 dark:text-slate-500">
                      No holidays added yet.
                    </p>) : null}
                  {holidayList.map(function (holiday) { return (<button key={holiday} type="button" onClick={function () {
                    return setFormValues(function (prev) { return (__assign(__assign({}, prev), { generalSetting: __assign(__assign({}, prev.generalSetting), { holidayList: prev.generalSetting.holidayList.filter(function (item) { return item !== holiday; }) }) })); });
                }} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {holiday} ×
                    </button>); })}
                </div>
                {getError("generalSetting.holidayList") ? (<p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {getError("generalSetting.holidayList")}
                  </p>) : null}
              </div>
            </section>) : null}

          {currentStep === 5 ? (<section className="space-y-5">
              {customFields.fields.length === 0 ? (<div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                  No employee custom fields yet. Add fields for IDs, probation
                  notes, equipment ownership, or any company-specific employee
                  metadata.
                </div>) : null}

              {customFields.fields.map(function (field, index) {
                var _a, _b, _c, _d, _e;
                var fieldType = (_a = watchedCustomFields === null || watchedCustomFields === void 0 ? void 0 : watchedCustomFields[index]) === null || _a === void 0 ? void 0 : _a.fieldType;
                return (<div key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Field {index + 1}
                      </h2>
                      <button type="button" onClick={function () { return customFields.remove(index); }} className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400">
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <form_field_1.FormField label="Field Name" error={getError("employeeCustomFields.".concat(index, ".fieldName"))} required>
                        <text_input_1.TextInput name={"employeeCustomFields.".concat(index, ".fieldName")} value={(_b = field.fieldName) !== null && _b !== void 0 ? _b : ""} onChange={function (e) {
                        return handleArrayFieldChange(index, "employeeCustomFields", e.target.value);
                    }} onBlur={formik.handleBlur} placeholder="Blood Group"/>
                      </form_field_1.FormField>
                      <form_field_1.FormField label="Field Type" error={getError("employeeCustomFields.".concat(index, ".fieldType"))} required>
                        <select_input_1.SelectInput name={"employeeCustomFields.".concat(index, ".fieldType")} value={(_c = field.fieldType) !== null && _c !== void 0 ? _c : "TEXT"} onChange={function (e) {
                        return handleArrayFieldChange(index, "employeeCustomFields", e.target.value);
                    }} onBlur={formik.handleBlur}>
                          <option value="TEXT">Text</option>
                          <option value="NUMBER">Number</option>
                          <option value="DATE">Date</option>
                          <option value="DROPDOWN">Dropdown</option>
                          <option value="CHECKBOX">Checkbox</option>
                        </select_input_1.SelectInput>
                      </form_field_1.FormField>
                      <toggle_field_1.ToggleField checked={(_d = field.required) !== null && _d !== void 0 ? _d : false} onChange={function (checked) {
                        setFormValues(function (prev) {
                            var updated = __spreadArray([], prev.employeeCustomFields, true);
                            updated[index] = __assign(__assign({}, updated[index]), { required: checked });
                            return __assign(__assign({}, prev), { employeeCustomFields: updated });
                        });
                        setTouched(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a["employeeCustomFields.".concat(index, ".required")] = true, _a)));
                        });
                    }} label="Required Field" description="Employees must fill this field."/>
                    </div>

                    {fieldType === "DROPDOWN" ? (<form_field_1.FormField label="Dropdown Options" hint="Enter one option per line." error={getError("employeeCustomFields.".concat(index, ".options"))}>
                        <textarea value={((_e = field.options) !== null && _e !== void 0 ? _e : []).join("\n")} onChange={function (event) {
                            var newOptions = event.target.value
                                .split("\n")
                                .map(function (item) { return item.trim(); })
                                .filter(Boolean);
                            setFormValues(function (prev) {
                                var updated = __spreadArray([], prev.employeeCustomFields, true);
                                updated[index] = __assign(__assign({}, updated[index]), { options: newOptions });
                                return __assign(__assign({}, prev), { employeeCustomFields: updated });
                            });
                            setTouched(function (prev) {
                                var _a;
                                return (__assign(__assign({}, prev), (_a = {}, _a["employeeCustomFields.".concat(index, ".options")] = true, _a)));
                            });
                        }} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900"/>
                      </form_field_1.FormField>) : null}
                  </div>);
            })}

              <button type="button" onClick={function () {
                return customFields.append({
                    fieldName: "",
                    fieldType: "TEXT",
                    required: false,
                    options: [],
                });
            }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400">
                <md_1.MdAdd className="text-base"/>
                Add Custom Field
              </button>
            </section>) : null}

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between dark:border-slate-700">
            <div className="flex gap-3">
              <button type="button" onClick={function () { return setCurrentStep(function (step) { return Math.max(step - 1, 0); }); }} disabled={currentStep === 0} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                <md_1.MdArrowBack className="text-base"/>
                Back
              </button>
              <button type="button" onClick={function () {
            return setCurrentStep(function (step) { return Math.min(step + 1, steps.length - 1); });
        }} disabled={currentStep === steps.length - 1} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                <md_1.MdArrowForward className="text-base"/>
                Next
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={function () { return void submitForm("draft"); }} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400">
                {isSubmitting ? (<spinner_1.Spinner className="text-current" label="Saving draft"/>) : (<md_1.MdCheckCircle className="text-base"/>)}
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>
              <button type="button" onClick={function () { return void submitForm("complete"); }} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? (<spinner_1.Spinner className="text-white" label="Saving settings"/>) : (<md_1.MdArrowForward className="text-base"/>)}
                {isSubmitting
            ? "Saving..."
            : companyExists
                ? "Update Settings"
                : "Complete Setup"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>);
}
