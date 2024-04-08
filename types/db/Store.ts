import { UUID } from "crypto"

export type Store = {
    store_id?: UUID
    store_name: string;
    invite_code: string;
}
  