import { beforeEach, describe, expect, it, vi } from "vitest"

function makeFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type })
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(content).buffer,
  })
  return file
}

vi.mock("@/lib/config", () => ({
  getS3Client: vi.fn(() => ({ send: vi.fn().mockResolvedValue({}) })),
}))

vi.mock("@/lib/config/environment", () => ({
  env: {
    awsS3Bucket: "test-bucket",
    awsRegion: "ap-south-1",
  },
}))

vi.mock("@/lib/api/parseForms", () => ({
  parseFormData: vi.fn(async () => ({
    attachment_0: makeFile("hello", "a.txt", "text/plain"),
    visibility: "public",
  })),
}))

vi.mock("@/lib/utils/client", async () => {
  const actual = await vi.importActual<object>("@/lib/utils/client")
  return {
    ...actual,
    generateUUID: vi.fn(() => "fixed-uuid"),
  }
})

import { handleFileUploads, processFormDataWithUploads, uploadAvatarFile } from "@/lib/storage/s3Uploads"

describe("s3 upload helpers", () => {
  beforeEach(() => {
    process.env.AWS_S3_BUCKET = "test-bucket"
    process.env.AWS_REGION = "ap-south-1"
  })

  it("returns empty array when no attachments exist", async () => {
    const result = await handleFileUploads({})
    expect(result).toEqual([])
  })

  it("uploads avatar and returns public URL", async () => {
    const file = makeFile("avatar", "me.png", "image/png")
    const url = await uploadAvatarFile(file, "user-1")
    expect(url).toContain("https://test-bucket.s3.ap-south-1.amazonaws.com/avatars/user-1_")
  })

  it("processes form data and maps attachments", async () => {
    const mockRequest = {}
    const result = await processFormDataWithUploads(mockRequest, "bugs")
    expect(result.attachments).toBeTruthy()
    expect(Array.isArray(result.attachments)).toBe(true)
  })
})
