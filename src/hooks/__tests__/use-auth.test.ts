// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── Mock next/navigation ──────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ─── Mock server actions ───────────────────────────────────────────────────
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// ─── Mock anon-work-tracker ────────────────────────────────────────────────
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// ─── Typed imports after mocks ─────────────────────────────────────────────
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { useAuth } from "@/hooks/use-auth";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);

// ─── Helpers ───────────────────────────────────────────────────────────────
const SUCCESS = { success: true } as const;
const FAILURE = { success: false, error: "Invalid credentials" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no anon work, no existing projects
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════
// Initial state
// ══════════════════════════════════════════════════════════════════
describe("initial state", () => {
  it("returns signIn, signUp, and isLoading=false", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(result.current.isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// signIn — happy path
// ══════════════════════════════════════════════════════════════════
describe("signIn", () => {
  it("calls the signIn action with the provided credentials", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockSignIn).toHaveBeenCalledOnce();
    expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
  });

  it("returns the action result", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "pass");
    });

    expect(returnValue).toEqual(SUCCESS);
  });

  it("returns the failure result without navigating", async () => {
    mockSignIn.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrong");
    });

    expect(returnValue).toEqual(FAILURE);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("sets isLoading=true while the action is in-flight, then false after", async () => {
    let resolveSignIn!: (v: any) => void;
    mockSignIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      })
    );
    mockGetProjects.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.signIn("u@e.com", "p");
    });

    // Still in-flight — must be loading
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: false });
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("resets isLoading to false even when the action throws", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("u@e.com", "p").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// signUp — happy path
// ══════════════════════════════════════════════════════════════════
describe("signUp", () => {
  it("calls the signUp action with the provided credentials", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "securepass");
    });

    expect(mockSignUp).toHaveBeenCalledOnce();
    expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "securepass");
  });

  it("returns the action result", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("new@example.com", "pass");
    });

    expect(returnValue).toEqual(SUCCESS);
  });

  it("returns the failure result without navigating", async () => {
    mockSignUp.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("taken@example.com", "pass");
    });

    expect(returnValue).toEqual(FAILURE);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("sets isLoading=true while in-flight, then false", async () => {
    let resolveSignUp!: (v: any) => void;
    mockSignUp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignUp = resolve;
      })
    );

    const { result } = renderHook(() => useAuth());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.signUp("u@e.com", "p");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: false });
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("resets isLoading to false even when the action throws", async () => {
    mockSignUp.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("u@e.com", "p").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// Post-sign-in routing (handlePostSignIn)
// ══════════════════════════════════════════════════════════════════
describe("post-sign-in routing", () => {
  describe("branch 1 — anonymous work exists", () => {
    const anonWork = {
      messages: [{ role: "user", content: "Hello" }],
      fileSystemData: { "/": {} },
    };

    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockSignIn.mockResolvedValue(SUCCESS);
      mockCreateProject.mockResolvedValue({ id: "saved-anon-project" } as any);
    });

    it("creates a project with the anon messages and file system data", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockCreateProject).toHaveBeenCalledOnce();
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
    });

    it("clears anon work after saving", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockClearAnonWork).toHaveBeenCalledOnce();
    });

    it("navigates to the newly created project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockPush).toHaveBeenCalledWith("/saved-anon-project");
    });

    it("does NOT call getProjects (early return)", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });

  describe("branch 2 — no anon work, user has existing projects", () => {
    const existingProjects = [
      { id: "project-abc" },
      { id: "project-xyz" },
    ] as any[];

    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue(existingProjects);
      mockSignIn.mockResolvedValue(SUCCESS);
    });

    it("navigates to the most recent project (first in list)", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockPush).toHaveBeenCalledWith("/project-abc");
    });

    it("does NOT create a new project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });

  describe("branch 2 — anon work present but with empty messages", () => {
    beforeEach(() => {
      // Has data but no messages → should NOT be treated as anon work
      mockGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: { "/": {} },
      });
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }] as any[]);
      mockSignIn.mockResolvedValue(SUCCESS);
    });

    it("ignores anon work when messages array is empty and falls through to getProjects", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });
  });

  describe("branch 3 — no anon work, no existing projects (fresh user)", () => {
    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new-project" } as any);
      mockSignIn.mockResolvedValue(SUCCESS);
    });

    it("creates a new project for the fresh user", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockCreateProject).toHaveBeenCalledOnce();
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
    });

    it("navigates to the newly created project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("u@e.com", "p");
      });

      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });
  });

  describe("post-sign-up routing mirrors sign-in routing", () => {
    it("also triggers post-sign-in flow on successful signUp", async () => {
      mockSignUp.mockResolvedValue(SUCCESS);
      mockGetProjects.mockResolvedValue([{ id: "after-signup-proj" }] as any[]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass123");
      });

      expect(mockPush).toHaveBeenCalledWith("/after-signup-proj");
    });

    it("does NOT trigger post-sign-in flow on failed signUp", async () => {
      mockSignUp.mockResolvedValue(FAILURE);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("bad@example.com", "wrong");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
