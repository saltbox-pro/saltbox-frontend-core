type FileListItem = {
  originFileObj?: File;
};

export function getImportFormFile(fileList: FileListItem[] | undefined): File | undefined {
  return fileList?.[0]?.originFileObj;
}
