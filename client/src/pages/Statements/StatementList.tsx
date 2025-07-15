import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore } from '@/hooks/useFirestore';
import { Plus, Eye, Edit, Download, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Statement } from '@shared/schema';

export const StatementList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  
  const { documents: statements, loading, deleteDocument } = useFirestore('statements');
  const { documents: customers } = useFirestore('customers');

  const filteredStatements = statements?.filter((statement: Statement) => {
    const matchesSearch = statement.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         statement.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || statement.customerId === customerFilter;
    
    return matchesSearch && matchesCustomer;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this statement?')) {
      await deleteDocument(id);
    }
  };

  if (loading) {
    return (
      <Layout title="Statements">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Statements">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Statements</h2>
            <p className="text-slate-600">Generate and manage customer statements</p>
          </div>
          <Link href="/statements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Statement
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search statements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statement Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statement #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatements?.map((statement: Statement) => (
                  <TableRow key={statement.id}>
                    <TableCell className="font-medium">{statement.number}</TableCell>
                    <TableCell>{statement.customerName}</TableCell>
                    <TableCell>{new Date(statement.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {new Date(statement.startDate).toLocaleDateString()} - {new Date(statement.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${statement.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/statements/${statement.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(statement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
