class StatisticsController < ApplicationController
  layout 'map'
  def viz
    @tab = 'Statistics'
    if @search_scope
      @zip = @search_scope.to_i
    end
    @base_layer = 'grayscale'
    @map_control = {'zip'=> true, 'sidebar'=>"statistics/sidebar_choropleth", 'legend'=>true}
    @attributes_multi = ['sqft_value', 'value', 'pct_inc', 'pct_dec', 
                   'inventory', 
                   'listing_price',
                   'sqft_rental',
                   'price_to_rental',
                   'avg_elementary_rating', 'elementary_count', 'avg_middle_rating', 'middle_count', 'avg_high_rating', 'high_count'
    ]
    @attributes = @attributes_multi + ['cluster_on_sqft_price', 'cluster_on_volume']

    respond_to do |format|
      format.html do
        render layout: 'gmap'
      end
      format.json do
        render :json => {stats: @scope}
      end
    end
  end

  def index
    @tab = 'Statistics'
    if @search_scope
      @zip = @search_scope.to_i
    end
    @base_layer = 'grayscale'
    @map_control = {'zip'=> true, 'sidebar'=>"statistics/sidebar_choropleth", 'legend'=>true}
    @attributes_multi = ['median_sqft_price', 'median_sold_price', 'avg_sqft_price', 'volume', 
                   'avg_sold_sqft', 
                   #'avg_sold_age',
                   #'private_count',
                   'avg_elementary_rating', 'elementary_count', 'avg_middle_rating', 'middle_count', 'avg_high_rating', 'high_count'
    ]
    @attributes = @attributes_multi + ['cluster_on_sqft_price', 'cluster_on_volume']

    respond_to do |format|
      format.html do
        render
      end
      format.json do
        render :json => {stats: @scope}
      end
    end
  end

  def query
    @scope = HistoryStatistics.where(stats_params)
    respond_to do |format|
      format.json do
        render :json => @scope
      end
    end
  end

  def school
    @scope = SchoolStatistics.where(school_params)
    respond_to do |format|
      format.json do
        render :json => @scope
      end
    end
  end

  def query_county
    #@scope =  RegionZip.where(countyname: county_params['county']).includes('timeseries').where('extract(month from zip_timeseries.date) = ?', county_params['month']).references(:timeseries)
    @scope = RegionZip.select('*, zip_timeseries.regionname as zip, extract(year from zip_timeseries.date) as year').where(countyname: 'San Diego').joins(:timeseries).where('extract(month from zip_timeseries.date) = 12')
    respond_to do |format|
      format.json do
        render :json => @scope
      end
    end
  end

	def stats_params
    params.permit(:zip, :month, :tile)
  end
	def school_params
    params.permit(:zip, :year)
  end
	def county_params
    params.permit(:month, :county)
  end
end

