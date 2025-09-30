// src/components/QuoteTable.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, DatePicker, InputNumber, Checkbox, Typography, Space, message, Input } from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, CheckOutlined, CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Quote, ComponentMaterialCosting } from '../types';
import { saveQuotesToLocalStorage, getQuotesFromLocalStorage } from '../localStorageUtil';

const { Title, Text } = Typography;

// Normalize material costing fields (compat for potential typos in TXT)
const formatMaterialCost = (material: ComponentMaterialCosting) => {
  return {
    ...material,
    costPerSellingUnit: material.costPerSellingUnit || material.costPerSelling_unit || 0,
  };
};

const QuoteTable: React.FC = () => {
  // Quote data state
  const [quoteData, setQuoteData] = useState<Quote[]>([]);
  // Row expand state (toggle material costing details)
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Error state
  const [error, setError] = useState<string | null>(null);

  /** Read TXT and parse JSON */
  const loadTxtData = async () => {
    try {
      setIsLoading(true);
      // Read from public folder
      const response = await fetch('/Quote Data.txt'); 
      
      if (!response.ok) throw new Error(`Request failed: ${response.statusText}`);
      
      // Read TXT content
      const txtContent = await response.text();
      // Parse JSON data (matches Quote type)
      const parsedData = JSON.parse(txtContent) as Quote[];
      
      // Prefer LocalStorage data if present (edits)
      const storedData = getQuotesFromLocalStorage();
      if (storedData) {
        setQuoteData(storedData);
        message.success('Loaded locally saved quotes');
      } else {
        setQuoteData(parsedData);
        message.success('Loaded initial quotes from TXT');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Reading or parsing TXT failed';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load TXT on mount
  useEffect(() => {
    loadTxtData();
  }, []);

  /** Toggle row expand/collapse */
  const handleExpandRow = (id: string) => {
    setExpandedRowKeys(prev => 
      prev.includes(id) 
        ? prev.filter(key => key !== id) 
        : [...prev, id]
    );
  };

  /** Enter edit mode */
  const handleEdit = (record: Quote) => {
    setQuoteData(prev => 
      prev.map(quote => 
        quote.id === record.id 
          ? {
              ...quote,
              isEditing: true,
              // Save current data as temp edit backup
              tempData: {
                quoteName: quote.quoteName,
                itemName: quote.itemName,
                itemDescription: quote.itemDescription,
                quoteDate: quote.quoteDate,
                committedFlag: quote.committedFlag,
                supplier: { ...quote.supplier },
                fobPort: { ...quote.fobPort },
                costing: { ...quote.costing },
                clubCosting: { ...quote.clubCosting },
              },
            }
          : quote
      )
    );
  };

  /** Handle field change (update temp data) */
  const handleFieldChange = (
    record: Quote,
    field: string,
    value: any
  ) => {
    if (!record.tempData) return;
    
    setQuoteData(prev => 
      prev.map(quote => 
        quote.id === record.id 
          ? {
              ...quote,
              tempData: {
                ...quote.tempData,
                [field]: value,
              },
            }
          : quote
      )
    );
  };

  /** Save edits (apply temp data and exit edit mode) */
  const handleSave = (record: Quote) => {
    if (!record.tempData) return;
    
    const updatedQuotes = quoteData.map(quote => 
      quote.id === record.id 
        ? {
            ...quote,
            ...record.tempData, // merge temp edits
            isEditing: false,
            tempData: undefined, // clear temp data
          }
        : quote
    );
    
    setQuoteData(updatedQuotes);
    // Persist to LocalStorage
    saveQuotesToLocalStorage(updatedQuotes);
    message.success(`Saved edits for ${record.quoteName}`);
  };

  /** Cancel edits (revert) */
  const handleCancel = (record: Quote) => {
    setQuoteData(prev => 
      prev.map(quote => 
        quote.id === record.id 
          ? {
              ...quote,
              isEditing: false,
              tempData: undefined,
            }
          : quote
      )
    );
  };

  /** Table columns */
  const columns = [
    {
      title: 'Expand/Collapse',
      key: 'expand',
      width: 100,
      render: (_: any, record: Quote) => (
        <Button
          type="text"
          icon={expandedRowKeys.includes(record.id) ? <UpOutlined /> : <DownOutlined />}
          onClick={() => handleExpandRow(record.id)}
          size="small"
        />
      ),
    },
    {
      title: 'Quote Name',
      dataIndex: 'quoteName',
      key: 'quoteName',
      render: (text: string, record: Quote) =>
        record.isEditing ? (
          <Input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(record, 'quoteName', e.target.value)}
            style={{ width: '100%' }}
          />
        ) : (
          <Text strong>{text}</Text>
        ),
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200,
      render: (text: string, record: Quote) =>
        record.isEditing ? (
          <Input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(record, 'itemName', e.target.value)}
            style={{ width: '100%' }}
          />
        ) : (
          text
        ),
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplierName',
      render: (text: string, record: Quote) =>
        record.isEditing ? (
          <Input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(record, 'supplier', { name: e.target.value })}
            style={{ width: '100%' }}
          />
        ) : (
          text
        ),
    },
    {
      title: 'Quote Date',
      dataIndex: 'quoteDate',
      key: 'quoteDate',
      render: (text: string, record: Quote) =>
        record.isEditing ? (
          <DatePicker
            format="YYYY-MM-DD"
            value={text ? dayjs(text) : null}
            onChange={(date: any) => handleFieldChange(record, 'quoteDate', date ? date.toISOString() : '')}
            style={{ width: '100%' }}
          />
        ) : (
          new Date(text).toLocaleDateString()
        ),
    },
    {
      title: 'First Cost ($)',
      dataIndex: ['costing', 'firstCost'],
      key: 'firstCost',
      render: (text: number, record: Quote) =>
        record.isEditing ? (
          <InputNumber
            value={text}
            precision={2}
            onChange={(value: number | null) => handleFieldChange(record, 'costing', { ...record.costing, firstCost: value || 0 })}
            style={{ width: '100%' }}
          />
        ) : (
          `$${text.toFixed(2)}`
        ),
    },
    {
      title: 'Retail Price ($)',
      dataIndex: ['clubCosting', 'retailPrice'],
      key: 'retailPrice',
      render: (text: number, record: Quote) =>
        record.isEditing ? (
          <InputNumber
            value={text}
            precision={2}
            onChange={(value: number | null) => handleFieldChange(record, 'clubCosting', { retailPrice: value || 0 })}
            style={{ width: '100%' }}
          />
        ) : (
          `$${text.toFixed(2)}`
        ),
    },
    {
      title: 'Committed',
      dataIndex: 'committedFlag',
      key: 'committedFlag',
      render: (text: boolean, record: Quote) =>
        record.isEditing ? (
          <Checkbox
            checked={text}
            onChange={(e: any) => handleFieldChange(record, 'committedFlag', e.target.checked)}
          />
        ) : (
          text ? <Text type="success">Yes</Text> : <Text type="warning">No</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Quote) =>
        record.isEditing ? (
          <Space size="small">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleSave(record)}
            >
              Save
            </Button>
            <Button
              type="text"
              icon={<CloseOutlined />}
              size="small"
              onClick={() => handleCancel(record)}
              danger
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
        ),
    },
  ];

  /** Expanded row content (component material costing details) */
  const expandedRowRender = (record: Quote) => {
    // Normalize material costing (compat typos)
    const formattedMaterials = record.costing.componentMaterialCosting.map(formatMaterialCost);
    
    // Material costing table columns
    const materialColumns = [
      {
        title: 'Material Description',
        dataIndex: 'materialDescription',
        key: 'materialDescription',
      },
      {
        title: 'Unit Cost ($)',
        dataIndex: 'costPerSellingUnit',
        key: 'costPerSellingUnit',
        render: (text: number) => `$${text.toFixed(2)}`,
      },
    ];

    return (
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Component Material Costing Details</div>
        <Table
          dataSource={formattedMaterials}
          columns={materialColumns}
          pagination={false}
          rowKey="materialDescription"
          size="small"
        />
        {/* Material cost total */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Text strong>Total Material Cost: </Text>
          <Text strong>
            ${formattedMaterials.reduce((sum, mat) => sum + mat.costPerSellingUnit, 0).toFixed(2)}
          </Text>
        </div>
      </div>
    );
  };

  // Loading / error / empty states
  if (isLoading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading quotes...</div>;
  if (error) return <div style={{ padding: 20, color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  if (quoteData.length === 0) return <div style={{ padding: 20, textAlign: 'center' }}>No quote data</div>;

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 16 }}>Product Quote Management Table</Title>
      <Table
        columns={columns}
        dataSource={quoteData}
        rowKey="id"
        expandedRowKeys={expandedRowKeys}
        expandedRowRender={expandedRowRender}
        bordered
        size="middle"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default QuoteTable;


