import dayjs from "dayjs";

export function buildJobsListQuery(
  createdSince: dayjs.Dayjs | null,
  mongoDBQuery: object | undefined
): Record<string, unknown> {
  if (!createdSince) {
    return (mongoDBQuery as Record<string, unknown>) ?? {};
  }

  const periodFilter = {
    created: {
      $gte: createdSince.toDate(),
    },
  };

  if (!mongoDBQuery || Object.keys(mongoDBQuery).length === 0) {
    return periodFilter;
  }

  const query = mongoDBQuery as Record<string, unknown>;
  const userCreatedFilter = query.created;

  if (
    !userCreatedFilter ||
    typeof userCreatedFilter !== "object" ||
    Array.isArray(userCreatedFilter)
  ) {
    return { ...query, ...periodFilter };
  }

  const { created: _created, ...restQuery } = query;

  return {
    ...restQuery,
    $and: [periodFilter, { created: userCreatedFilter }],
  };
}
