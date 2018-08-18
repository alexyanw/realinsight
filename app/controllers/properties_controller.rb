class PropertiesController < ApplicationController
  layout 'map'

  def index
    @tab = 'Search'
    @map_control = {'zip'=> false}
    render layout: 'gmap'
  end

  def search
    @map_control = {}
    render layout: 'gmap'
  end

  def query
    @map_control = {'zip'=> false}
    @zip = nil
    start_date, end_date = '09/01/2017', '10/01/2017'
    if params['filter'] and params['filter']['start_date']
      start_date = params['filter']['start_date']
      end_date = params['filter']['end_date']
    end

    if params['scope']
      str_scope = params['scope'].chomp
      str_scope.gsub!(/\s+/, '')
      if str_scope.match(/^\d{5}$/) # zip
        @scope = Property.valid().where(zip: str_scope)
      elsif str_scope.match(/^[\d,]*$/)
        pins = str_scope.split(',')
        @scope = Property.valid().where(pin: pins)
      else
        @scope = Property.address_like(str_scope)
      end
    elsif params['geom']
      geom = ActiveSupport::JSON.decode(params['geom'])
      wkt = geom.map { |x| "%8.5f %8.5f" % [x['lat'], x['lon']] }
      wkt.push(wkt[0])
      @scope = Property.within_area(wkt)
    else
      #@scope = Property.valid().limit(5)
      @scope = Property.valid().where(zip: 92129)
    end
    @scope = @scope.includes(:transactions).where("transactions.date between ? and ?", start_date, end_date).references(:transactions)

    respond_to do |format|
      format.html do
        render
      end
      format.json do
        render :json => @scope
      end
    end
  end

  def schools
    @schools = Property.find(params[:property_id]).schools

    respond_to do |format|
      format.html do
        render
      end
      format.json do
        render :json => @schools.to_json
      end
    end

  end
end
