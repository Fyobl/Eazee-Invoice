import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Product } from '@shared/schema';
import { formatCurrency } from '@/lib/currency';

interface SearchableProductSelectProps {
  products: Product[] | undefined;
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  onProductSelect,
  placeholder = "Search and select product...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setOpen(false);
    setSearchValue('');
  };

  const handleAddNew = () => {
    // Create a new product object with the search value as description
    const newProduct: Product = {
      id: `temp-${Date.now()}`,
      uid: '', // This will be set by the parent component
      name: searchValue,
      description: searchValue,
      unitPrice: 0,
      taxRate: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    onProductSelect(newProduct);
    setOpen(false);
    setSearchValue('');
  };

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search products..." 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 text-center">
                <p className="text-sm text-muted-foreground">No product found.</p>
                {searchValue && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNew}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{searchValue}" as new item
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleProductSelect(product)}
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{product.name}</span>
                    {product.description && (
                      <span className="text-sm text-muted-foreground">{product.description}</span>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium">
                        {formatCurrency(product.unitPrice, 'GBP')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Tax: {product.taxRate}%
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};