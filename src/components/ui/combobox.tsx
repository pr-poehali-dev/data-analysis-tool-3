import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Icon from "@/components/ui/icon"

interface ComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Выберите...",
  searchPlaceholder = "Поиск...",
  emptyText = "Ничего не найдено",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal text-left h-10 px-3 py-2",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            "border-input bg-background",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-sm">{value || placeholder}</span>
          <Icon
            name="ChevronsUpDown"
            size={16}
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start" side="bottom" avoidCollisions={false}>
        <Command shouldFilter={false} className="rounded-lg border-0 shadow-lg">
          <CommandInput 
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
            className="border-b"
          />
          <CommandList className="max-h-[280px] overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center gap-3 py-8 px-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Icon name="Search" size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">{emptyText}</p>
                  {inputValue && (
                    <p className="text-xs text-muted-foreground">Нажмите кнопку ниже, чтобы добавить</p>
                  )}
                </div>
                {inputValue && (
                  <Button
                    size="sm"
                    className="gap-2 mt-2"
                    onClick={() => {
                      onValueChange?.(inputValue)
                      setOpen(false)
                      setInputValue("")
                    }}
                  >
                    <Icon name="Plus" size={14} />
                    Использовать "{inputValue}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup className="p-2">
              {options
                .filter(option => 
                  option.label.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setInputValue("")
                  }}
                  className="cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  <div className="flex items-center w-full gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}