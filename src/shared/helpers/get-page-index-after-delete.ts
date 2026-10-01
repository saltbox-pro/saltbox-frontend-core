export function getPageIndexAfterDelete(pageIndex: number, rowsOnPage: number): number {
  return rowsOnPage === 1 && pageIndex > 0 ? pageIndex - 1 : pageIndex;
}
