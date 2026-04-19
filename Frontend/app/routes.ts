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
  layout("auth/layout.tsx", [
    route("auth/login", "auth/login.tsx"),
    route("auth/register", "auth/register.tsx"),
    route("auth/forgot-password", "auth/forgot-password.tsx"),
  ]),
] satisfies RouteConfig;
