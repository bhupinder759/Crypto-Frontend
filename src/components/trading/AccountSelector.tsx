"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface TradingAccount {
  id: string;
  userId: string;
  accountType: "DEMO" | "REAL";
  accountName: string;
  balance: string;
  currency: string;
  initialBalance: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export const AccountSelector = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["trading-accounts", userId],
    queryFn: async () => {
      const response = await axios.get(`/api/trading/accounts?userId=${userId}`);
      return response.data as TradingAccount[];
    },
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (accountType: "DEMO" | "REAL") => {
      const response = await axios.post("/api/trading/accounts", {
        userId,
        accountType,
        accountName: `${accountType} Account - ${new Date().toLocaleDateString()}`,
        balance: accountType === "DEMO" ? "10000" : "0",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-accounts", userId] });
    },
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
  const demoAccounts = accounts.filter((acc) => acc.accountType === "DEMO");
  const realAccounts = accounts.filter((acc) => acc.accountType === "REAL");

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Trading Accounts</h2>
        <p className="text-slate-400">Manage your demo and real trading accounts</p>
      </div>

      {/* Account Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Active Account
        </label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-slate-500 transition"
        >
          {isLoading ? (
            <option>Loading accounts...</option>
          ) : accounts.length === 0 ? (
            <option>No accounts. Create one below.</option>
          ) : (
            accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName} ({account.accountType}) - $
                {parseFloat(account.balance).toFixed(2)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Account Info */}
      {selectedAccount && (
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Account Type</p>
              <p className={`text-lg font-bold ${
                selectedAccount.accountType === "DEMO"
                  ? "text-blue-400"
                  : "text-yellow-400"
              }`}>
                {selectedAccount.accountType}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Balance</p>
              <p className="text-white text-lg font-bold">
                ${parseFloat(selectedAccount.balance).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Status</p>
              <p className="text-green-400 text-lg font-bold">
                {selectedAccount.status}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Currency</p>
              <p className="text-white text-lg font-bold">
                {selectedAccount.currency}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Groups */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Demo Accounts</h3>
        <div className="space-y-2 mb-4">
          {demoAccounts.length === 0 ? (
            <p className="text-slate-400 text-sm">No demo accounts yet</p>
          ) : (
            demoAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedAccountId === account.id
                    ? "bg-blue-900 border-blue-500"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    {account.accountName}
                  </span>
                  <span className="text-green-400 font-bold">
                    ${parseFloat(account.balance).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => createAccountMutation.mutate("DEMO")}
            disabled={createAccountMutation.isPending}
            className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {createAccountMutation.isPending ? "Creating..." : "+ Create Demo Account"}
          </button>
        </div>
      </div>

      {/* Real Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Real Accounts</h3>
        <div className="space-y-2">
          {realAccounts.length === 0 ? (
            <p className="text-slate-400 text-sm">No real accounts yet</p>
          ) : (
            realAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedAccountId === account.id
                    ? "bg-yellow-900 border-yellow-500"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    {account.accountName}
                  </span>
                  <span className="text-green-400 font-bold">
                    ${parseFloat(account.balance).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => createAccountMutation.mutate("REAL")}
            disabled={createAccountMutation.isPending}
            className="w-full mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {createAccountMutation.isPending ? "Creating..." : "+ Create Real Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
