class TransactionsController < ApplicationController
  layout 'map'

  def index
		property = Property.find(params[:property_id])

    respond_to do |format|
      format.html do
          render
      end
      format.json { render :json => property.transactions.order('date DESC')}
    end
  end
end

