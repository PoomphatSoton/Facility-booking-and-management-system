import {
  type RouteConfig,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  route("", "facility/facility-list.tsx"),
  route("booking/new/:facilityId", "booking/new-booking.tsx"),
  route("booking/my", "booking/my-bookings.tsx"),
  route("booking/notifications", "booking/notifications.tsx"),
  route("staff/pending", "staff/pending-requests.tsx"),
  route("staff/upcoming", "staff/upcoming-bookings.tsx"),
  route("equipment-reports", "equipment-report/equipment-report-list.tsx"),
  route("equipment-reports-admin", "equipment-report/equipment-report-admin.tsx"),
  route("find-partners", "partner-matching/find-partners.tsx"),
  route("partner-requests", "partner-matching/partner-requests.tsx"),
  route("find-partners/:partnerId", "partner-matching/partner-profile.tsx"),
  route("booking/new/:facilityId", "booking/new-booking.tsx"),
  route("booking/my", "booking/my-bookings.tsx"),
  route("booking/notifications", "booking/notifications.tsx"),
  route("staff/pending", "staff/pending-requests.tsx"),
  layout("auth/layout.tsx", [
    route("auth/login", "auth/login.tsx"),
    route("auth/register", "auth/register.tsx"),
    route("auth/forgot-password", "auth/forgot-password.tsx"),
  ]),
] satisfies RouteConfig;