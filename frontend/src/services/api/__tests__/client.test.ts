import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../client";
import toast from "react-hot-toast";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("API Client", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mock.reset();
  });

  it("makes successful GET request", async () => {
    const responseData = { message: "success" };
    mock.onGet("/test").reply(200, responseData);

    const response = await apiClient.get("/test");
    expect(response.data).toEqual(responseData);
    expect(response.status).toBe(200);
  });

  it("makes successful POST request", async () => {
    const requestData = { name: "test" };
    const responseData = { id: "123", ...requestData };
    mock.onPost("/test", requestData).reply(201, responseData);

    const response = await apiClient.post("/test", requestData);
    expect(response.data).toEqual(responseData);
    expect(response.status).toBe(201);
  });

  it("handles 500 server error", async () => {
    mock.onGet("/error").reply(500, { detail: "Internal server error" });

    await expect(apiClient.get("/error")).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Server Error: Internal server error");
  });

  it("handles 404 not found error", async () => {
    mock.onGet("/notfound").reply(404, { detail: "Resource not found" });

    await expect(apiClient.get("/notfound")).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Not Found: Resource not found");
  });

  it("handles 400 bad request error", async () => {
    mock.onPost("/invalid").reply(400, { detail: "Invalid data" });

    await expect(apiClient.post("/invalid", {})).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Bad Request: Invalid data");
  });

  it("handles network error", async () => {
    mock.onGet("/test").networkError();

    await expect(apiClient.get("/test")).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Network Error: Cannot reach the server");
  });

  it("handles timeout error", async () => {
    mock.onGet("/slow").timeout();

    await expect(apiClient.get("/slow")).rejects.toThrow();
  });

  it("has correct base URL", () => {
    expect(apiClient.defaults.baseURL).toBeTruthy();
  });

  it("has correct default headers", () => {
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("has correct timeout", () => {
    expect(apiClient.defaults.timeout).toBe(300000);
  });
});
