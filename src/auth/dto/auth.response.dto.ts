export class FamilyResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;

  // no password needed in the response
  deleted: boolean;
  deletedAt: Date | null;
  deletedBy: number | null;
  deleteReason: string | null;

  deactivated: boolean;
}
