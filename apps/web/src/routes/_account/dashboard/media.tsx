import { createFileRoute } from "@tanstack/react-router";
import { MediaLibrary } from "#/components/media-library";
export const Route = createFileRoute("/_account/dashboard/media")({ component: MediaLibrary });
