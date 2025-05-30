'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

type Alias = Doc<'quoteAliases'>;

export default function QuoteAliasManager() {
  const aliases = useQuery(api.quoteAliases.listAliases) as Alias[] | undefined;
  const upsert = useMutation(api.quoteAliases.upsertAlias);
  const del = useMutation(api.quoteAliases.deleteAlias);

  const [symbol, setSymbol] = useState('');
  const [quoteSymbol, setQuoteSymbol] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [quoteType, setQuoteType] = useState<'crypto' | 'stock'>('crypto');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert({
      symbol: symbol.trim().toUpperCase(),
      quoteSymbol: quoteSymbol ? quoteSymbol.trim().toUpperCase() : undefined,
      fixedPrice: fixedPrice ? Number(fixedPrice) : undefined,
      quoteType
    });
    setSymbol('');
    setQuoteSymbol('');
    setFixedPrice('');
  };

  const handleDelete = async (id: string) => {
    await del({ id: id as any });
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm">Symbol</label>
          <input
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm">Quote Symbol</label>
          <input
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700"
            value={quoteSymbol}
            onChange={e => setQuoteSymbol(e.target.value)}
            placeholder="Use price from"
          />
        </div>
        <div>
          <label className="block text-sm">Fixed Price</label>
          <input
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700"
            type="number"
            step="any"
            value={fixedPrice}
            onChange={e => setFixedPrice(e.target.value)}
            placeholder="Override"
          />
        </div>
        <div>
          <label className="block text-sm">Type</label>
          <select
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700"
            value={quoteType}
            onChange={e => setQuoteType(e.target.value as 'crypto' | 'stock')}
          >
            <option value="crypto">Crypto</option>
            <option value="stock">Stock</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
        >
          Add
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-700">
            <th className="px-2 py-1">Symbol</th>
            <th className="px-2 py-1">Quote Symbol</th>
            <th className="px-2 py-1">Fixed Price</th>
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {aliases && aliases.map(a => (
            <tr key={a._id} className="border-b border-gray-800">
              <td className="px-2 py-1 font-mono">{a.symbol}</td>
              <td className="px-2 py-1">{a.quoteSymbol || '-'}</td>
              <td className="px-2 py-1">{a.fixedPrice !== undefined ? a.fixedPrice : '-'}</td>
              <td className="px-2 py-1">{a.quoteType || '-'}</td>
              <td className="px-2 py-1">
                <button
                  onClick={() => handleDelete(a._id)}
                  className="text-red-400 hover:text-red-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
