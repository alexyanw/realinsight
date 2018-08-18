class EstimationController < ApplicationController
  layout 'dashboard'

  def index
    @tab = 'Estimation'
    zestimate = Rubillow::HomeValuation.zestimate({ :zpid => '48749425' })
    if zestimate.success?
      puts zestimate.price
    end

		prop = Rubillow::PropertyDetails.deep_search_results({ :address => '2114 Bigelow Ave', :citystatezip => 'Seattle, WA' })
    if prop.success?
      puts prop.xml
      puts prop.tax_assessment_year  # "2010"
      puts prop.last_sold_price      # "1025000"
      puts prop.address[:latitude]   # "47.637933"
    end

   #@postings = Rubillow::Postings.region_postings({ :zipcode => '92129' })
   #if @postings.success?
   #  puts "hhhhhhhhhhhhh", @postings.xml
   #end

    render
  end

  def query
    @tab = 'Estimation'
    pin = params['pin'] || params['scope']
    @property = Property.valid().find_by(pin: pin)
    @estimates = PropertyEstimation.where(pin: pin)
    @transactions = Transaction.where(pin: pin)
    @zip = HistoryStatistics.where(zip: @property.zip, month:0, tile:0)
    @county = HistoryStatistics.where(zip: '', month:0, tile:0)
    @res_std = ResidualStd.order('date')

    respond_to do |format|
      format.html do
        render
      end
      format.json do
        render :json => {property: @property, estimates: @estimates, transaction: @transactions}
      end
    end
  end
end
