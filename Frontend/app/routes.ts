import {
  type RouteConfig,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  route("", "facility/facility-list.tsx"),
  route("equipment-reports", "equipment-report/equipment-report-list.tsx"),
  route("equipment-reports-admin", "equipment-report/equipment-report-admin.tsx"),
  route("find-partners", "partner-matching/find-partners.tsx"),
  route("partner-requests", "partner-matching/partner-requests.tsx"),
  route("find-partners/:partnerId", "partner-matching/partner-profile.tsx"),
  route("staff/pending", "staff/pending-requests.tsx"),
  route("staff/upcoming", "staff/upcoming-bookings.tsx"),
  route("equipment-reports", "equipment-report/equipment-report-list.tsx"),
  route("equipment-reports-admin", "equipment-report/equipment-report-admin.tsx"),
  route("find-partners", "partner-matching/find-partners.tsx"),
  route("partner-requests", "partner-matching/partner-requests.tsx"),
  route("staff/pending", "staff/pending-requests.tsx"),
  route("staff/upcoming", "staff/upcoming-bookings.tsx"),
  route("admin", "admin/admin-page.tsx"),
  route("admin/facility/create", "admin/create-facility.tsx", { id: "admin-facility-create" }),
  route("admin/facility/edit/:facilityId", "admin/create-facility.tsx", { id: "admin-facility-edit" }),
  layout("auth/layout.tsx", [
    route("auth/login", "auth/login.tsx"),
    route("auth/register", "auth/register.tsx"),
    route("auth/forgot-password", "auth/forgot-password.tsx"),
  ]),
] satisfies RouteConfig;