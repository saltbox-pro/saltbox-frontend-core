import { fileDownloader } from "saltbox-core/features/file-download";

describe("fileDownloader.getFilenameFromHeaders", () => {
  it("returns null when header is missing", () => {
    const headers = new Headers();

    expect(fileDownloader.getFilenameFromHeaders(headers)).toBeNull();
  });

  it("parses filename without quotes", () => {
    const headers = new Headers({
      "Content-Disposition": "attachment; filename=report.csv",
    });

    expect(fileDownloader.getFilenameFromHeaders(headers)).toBe("report.csv");
  });

  it("parses filename with quotes", () => {
    const headers = new Headers({
      "Content-Disposition": 'attachment; filename="report.csv"',
    });

    expect(fileDownloader.getFilenameFromHeaders(headers)).toBe("report.csv");
  });

  it("parses filename when other parameters are present", () => {
    const headers = new Headers({
      "Content-Disposition": 'attachment; filename="report.csv"; size=1234',
    });

    expect(fileDownloader.getFilenameFromHeaders(headers)).toBe("report.csv");
  });
});
