import { useRouter } from 'next/navigation';
import { TableRow, TableCell } from "@/components/ui/table";
import { Notification } from '@/app/dashboard/page';

type NotificationItemProps = {
  notification: Notification;
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const router = useRouter();
  const bgColorClass = notification.severity === 3 ? 'bg-red-400' :
                       notification.severity === 2 ? 'bg-yellow-400' :
                       notification.severity === 1 ? 'bg-primary' : '';

  const handleRowClick = () => {
    if (notification.onClickLink) {
      router.push(notification.onClickLink);
    }
  };

  const rowClassNames = `${notification.onClickLink ? "hover:cursor-pointer" : ""} w-full`;

  return (
      <TableRow className={rowClassNames} onClick={handleRowClick}>
        <TableCell className="font-medium">
          <div className={`h-3 w-3 rounded-full ${bgColorClass}`} />
        </TableCell>
        <TableCell className="w-full">
          <div className="flex flex-col">
            <div className="font-semibold">{notification.title}</div>
            <div className="text-muted-foreground">{notification.description}</div>
          </div>
        </TableCell>
      </TableRow>
  );
};

export default NotificationItem;
