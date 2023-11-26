import { UUID } from "crypto"

export type UserProfile = {
    user_id: UUID
    store_id: UUID
    first_name: string;
    last_name: string;
}
  