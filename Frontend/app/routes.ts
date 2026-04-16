import {
  type RouteConfig,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  route("", "facility/facility-list.tsx"),
  route("booking/new/:facilityId", "booking/new-booking.tsx"),
  route("staff/pending", "staff/pending-requests.tsx"),
  layout("auth/layout.tsx", [
    route("auth/login", "auth/login.tsx"),
    route("auth/register", "auth/register.tsx"),
    route("auth/forgot-password", "auth/forgot-password.tsx"),
  ]),
] satisfies RouteConfig;
