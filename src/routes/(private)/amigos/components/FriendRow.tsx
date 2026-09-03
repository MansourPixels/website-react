import { Button, ButtonGroup, Popover } from "@heroui/react";
import { Ellipsis, UserMinus } from "lucide-react";
import { useState } from "react";

import { UserIdentity } from "@/components/UserIdentity";
import type { Friend } from "@/types/api/friend";
import { formatXp } from "@/utils/ranking";

import { DialogFriendRemoval } from "./DialogFriendRemoval";

interface FriendRowProps {
  friend: Friend;
  onRemove: (friend: Friend) => void;
}

export function FriendRow({ friend, onRemove }: FriendRowProps) {
  const [isRemovalOpen, setIsRemovalOpen] = useState(false);

  return (
    <li className="bg-surface shadow-surface flex items-center gap-3 rounded-xl p-3">
      <UserIdentity
        user={friend}
        linkToProfile
        caption={<span className="tabular-nums">{formatXp(friend.xp)}</span>}
        className="flex-1"
      />

      <Popover>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label={`Opções de @${friend.username}`}
        >
          <Ellipsis className="size-4" />
        </Button>
        <Popover.Content>
          <Popover.Dialog className="p-0">
            <ButtonGroup orientation="vertical" className="w-44">
              <Button
                variant="ghost"
                className="text-danger justify-start"
                onPress={() => setIsRemovalOpen(true)}
              >
                <UserMinus className="size-4" />
                Desfazer amizade
              </Button>
            </ButtonGroup>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <DialogFriendRemoval
        friend={friend}
        isOpen={isRemovalOpen}
        onOpenChange={setIsRemovalOpen}
        onConfirm={onRemove}
      />
    </li>
  );
}
