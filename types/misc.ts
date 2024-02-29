import { Store } from "./store"

export type DashboardInfo = {
    store: Store
    schedules_created: number
    packages_scheduled: number
    miles_driven: number | string
    delivery_efficiency: number | string
}


export type Notification = {
    severity: number;
    title: string;
    description: string;
    onClickLink?: string;
  }