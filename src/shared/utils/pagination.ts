import { func } from "joi";

export function pagination({page,limit, total}:{page:string, limit:string, total:number }) {
    const limitNumber = parseInt(limit, 10) || 10;
  const totalPages = Math.ceil(total / limitNumber);
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
  };

}