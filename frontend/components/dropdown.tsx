import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

interface ModelProp {
  value: string;
  description: string;
  type: string;
  loadingText: string;
}

interface DropdownProps {
  list: ModelProp[];
  selected: ModelProp;
  setSelected: (item: ModelProp) => void;
}

export default function Dropdown({
  list,
  selected,
  setSelected,
}: DropdownProps) {
  const handleSelect = (item: ModelProp) => {
    setSelected(item);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs w-20">
          {selected.value.length > 10
            ? selected.value.slice(0, 10) + "..."
            : selected.value}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white p-2 rounded-md shadow-md">
        {list.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onSelect={() => handleSelect(item)}
            className="text-xs flex flex-col gap-1 items-start"
          >
            {item.value.length > 10
              ? item.value.slice(0, 10) + "..."
              : item.value}
            <span className="text-[10px] text-gray-500">{item.type}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
