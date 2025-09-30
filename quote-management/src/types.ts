// src/types.ts
/** Supplier type */
export interface Supplier {
    name: string;
  }
  
  /** FOB port / origin type */
  export interface FobPort {
    countryOfOrigin: string;
  }
  
  /** Component material costing */
  export interface ComponentMaterialCosting {
    materialDescription: string;
    costPerSellingUnit: number;
    // Compat: handle possible typo in TXT (costPerSelling_unit)
    costPerSelling_unit?: number;
  }
  
  /** Costing */
  export interface Costing {
    firstCost: number;
    componentMaterialCosting: ComponentMaterialCosting[];
  }
  
  /** Club costing / retail price */
  export interface ClubCosting {
    retailPrice: number;
  }
  
  /** Quote entity */
  export interface Quote {
    id: string;
    quoteName: string;
    itemName: string;
    itemDescription: string;
    quoteDate: string; // ISO format (e.g. "2025-09-15T00:00:00Z")
    committedFlag: boolean;
    supplier: Supplier;
    fobPort: FobPort;
    costing: Costing;
    clubCosting: ClubCosting;
    // Edit state fields
    isEditing?: boolean; // whether in editing state
    tempData?: Partial<Omit<Quote, 'componentMaterialCosting' | 'isEditing' | 'tempData'>>; // temp edit data
  }