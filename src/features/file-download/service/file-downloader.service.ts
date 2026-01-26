class FileDownloader {
  async downloadByResponse(response: Response, fallBackFilename: string) {
    const filename = this.getFilenameFromHeaders(response.headers) || fallBackFilename;
    const blob = await response.blob();
    this.downloadBlob(blob, filename);
  }

  getFilenameFromHeaders(headers: Headers) {
    const contentDisposition = headers.get("Content-Disposition");
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch?.at(1)) {
        return filenameMatch.at(1);
      }
    }
    return null;
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 300);
  }
}

export const fileDownloader = new FileDownloader();
