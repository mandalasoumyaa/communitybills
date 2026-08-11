import React from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { 
  CreditCard, 
  Landmark, 
  Calendar, 
  ListChecks, 
  FileText, 
  StickyNote, 
  RotateCcw, 
  Save 
} from 'lucide-react';

const paymentStatuses = ['Paid', 'Pending', 'Unpaid'];

const paymentModes = [
  'Bank Transfer',
  'Cash',
  'UPI / QR Code',
  'Credit Card',
  'Cheque',
  'Other'
];

const accounts = [
  'SBI - Main Account',
  'HDFC - Reserve Account',
  'Petty Cash',
  'Maintenance Collection A/C',
  'Other'
];

export default function PaymentInformationSection({ selectedCategory, control, register, errors, setValue, onCancel, isSubmitting }) {
  const paymentStatus = useWatch({ control, name: 'paymentStatus' }) || '';
  const paymentMode = useWatch({ control, name: 'paymentMode' }) || '';
  const paidFromAccount = useWatch({ control, name: 'paidFromAccount' }) || '';
  const description = useWatch({ control, name: 'description' }) || '';
  const notes = useWatch({ control, name: 'notes' }) || '';

  const isUnpaidOrPending = paymentStatus === 'Unpaid' || paymentStatus === 'Pending';

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mt-8">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-[20px] font-bold text-[#0F172A] m-0 leading-tight">Payment Details</h3>
        </div>
      </div>

      <div className="p-8 pt-6 pb-2 space-y-6">
        {/* Row 1: Payment Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[14px] font-bold text-slate-800">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <Controller
              name="paymentStatus"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="flex gap-3">
                  {/* Paid Button */}
                  <button
                    type="button"
                    onClick={() => field.onChange('Paid')}
                    className={`flex-1 h-12 flex items-center justify-center gap-2.5 px-3 rounded-xl border font-bold text-sm transition-all ${
                      field.value === 'Paid'
                        ? 'border-[#10B981] bg-white text-[#10B981]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      field.value === 'Paid' ? 'border-[#10B981]' : 'border-slate-300'
                    }`}>
                      {field.value === 'Paid' && <div className="w-2 h-2 rounded-full bg-[#10B981]" />}
                    </div>
                    Paid
                  </button>

                  {/* Unpaid Button */}
                  <button
                    type="button"
                    onClick={() => field.onChange('Unpaid')}
                    className={`flex-1 h-12 flex items-center justify-center gap-2.5 px-3 rounded-xl border font-bold text-sm transition-all ${
                      field.value === 'Unpaid'
                        ? 'border-slate-400 bg-white text-slate-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      field.value === 'Unpaid' ? 'border-slate-400' : 'border-slate-300'
                    }`}>
                      {field.value === 'Unpaid' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                    </div>
                    Unpaid
                  </button>
                </div>
              )}
            />
            {errors.paymentStatus && (
              <span className="text-xs text-red-500 font-medium">{errors.paymentStatus.message}</span>
            )}
          </div>
        </div>

        {/* Row 2: remaining details (below status) */}
        {!isUnpaidOrPending && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Payment Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-805">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="paymentMode"
                  control={control}
                  rules={{ required: isUnpaidOrPending ? false : 'Required' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full h-12 px-4 bg-white border ${errors.paymentMode ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'} rounded-xl text-[15px] font-medium text-slate-800 outline-none transition-all cursor-pointer`}
                    >
                      <option value="" disabled>Select mode</option>
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              {errors.paymentMode && (
                <span className="text-xs text-red-500 font-medium">{errors.paymentMode.message}</span>
              )}
            </div>

            {/* Paid From Account */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-850">
                Paid From Account <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="paidFromAccount"
                  control={control}
                  rules={{ required: isUnpaidOrPending ? false : 'Required' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full h-12 px-4 bg-white border ${errors.paidFromAccount ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'} rounded-xl text-[15px] font-medium text-slate-800 outline-none transition-all cursor-pointer`}
                    >
                      <option value="" disabled>Select account</option>
                      {accounts.map((acc) => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              {errors.paidFromAccount && (
                <span className="text-xs text-red-500 font-medium">{errors.paidFromAccount.message}</span>
              )}
            </div>

            {/* Payment Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-slate-800">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  {...register('date', { required: isUnpaidOrPending ? false : 'Required' })}
                  type="date"
                  className={`w-full h-12 px-4 bg-white border ${errors.date ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'} rounded-xl text-[15px] font-medium text-slate-800 outline-none transition-all`}
                />
              </div>
              {errors.date && (
                <span className="text-xs text-red-500 font-medium">{errors.date.message}</span>
              )}
            </div>
          </div>
        )}

        {/* Custom Input Row (Appears below the dropdowns if "Other" is selected) */}
        {!isUnpaidOrPending && (paymentMode === 'Other' || paidFromAccount === 'Other') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 fade-slide-in">
            {/* Custom Payment Mode */}
            {paymentMode === 'Other' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-slate-805">
                  Custom Payment Mode <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('customPaymentMode', { required: paymentMode === 'Other' ? 'Required' : false })}
                  placeholder="Enter custom payment mode"
                  className={`w-full h-12 px-4 bg-white border ${errors.customPaymentMode ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'} rounded-xl text-[15px] font-medium text-slate-800 outline-none transition-all`}
                />
                {errors.customPaymentMode && (
                  <span className="text-xs text-red-500 font-medium">{errors.customPaymentMode.message}</span>
                )}
              </div>
            ) : <div></div>}

            {/* Custom Account */}
            {paidFromAccount === 'Other' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-slate-850">
                  Custom Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('customPaidFromAccount', { required: paidFromAccount === 'Other' ? 'Required' : false })}
                  placeholder="Enter custom account name"
                  className={`w-full h-12 px-4 bg-white border ${errors.customPaidFromAccount ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'} rounded-xl text-[15px] font-medium text-slate-800 outline-none transition-all`}
                />
                {errors.customPaidFromAccount && (
                  <span className="text-xs text-red-500 font-medium">{errors.customPaidFromAccount.message}</span>
                )}
              </div>
            ) : <div></div>}

            {/* Empty block for layout alignment */}
            <div></div>
          </div>
        )}
      </div>

      {!isUnpaidOrPending && (
        <>
          {/* Header for Additional Information */}
          <div className="p-8 pb-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 m-0 leading-tight">Additional Information</h3>
                <p className="text-[13px] text-slate-500 mt-0.5 m-0 font-medium">Add any extra details about this payment</p>
              </div>
            </div>
          </div>

          {/* Textareas row (side-by-side description & notes) */}
          <div className="px-8 pb-8 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-800">Description (Optional)</label>
                <div className="flex gap-3.5 items-start border border-slate-200 rounded-xl p-3.5 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <textarea
                    {...register('description')}
                    placeholder="Enter description..."
                    className="w-full min-h-[90px] border-none outline-none resize-none text-[15px] text-slate-800 placeholder-slate-400 bg-transparent"
                    maxLength={500}
                  />
                </div>
                <div className="text-right text-[12px] text-slate-400 font-medium mt-1">
                  {(description || '').length}/500
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-800">Notes (Optional)</label>
                <div className="flex gap-3.5 items-start border border-slate-200 rounded-xl p-3.5 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <StickyNote size={18} />
                  </div>
                  <textarea
                    {...register('notes')}
                    placeholder="Add any additional notes..."
                    className="w-full min-h-[90px] border-none outline-none resize-none text-[15px] text-slate-800 placeholder-slate-400 bg-transparent"
                    maxLength={500}
                  />
                </div>
                <div className="text-right text-[12px] text-slate-400 font-medium mt-1">
                  {(notes || '').length}/500
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
