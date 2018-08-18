class SchoolsController < ApplicationController
  layout 'map'

  def index
    @schools = []
    if params['scope']
			str_scope = params['scope'].chomp
			str_scope.gsub!(/\s+/, '')
      if str_scope.match(/^\d{5}$/)
        @schools = School.where(zip: str_scope)
      end
    elsif params['geom']
      geom = ActiveSupport::JSON.decode(params['geom'])
      wkt = geom.map { |x| "%8.5f %8.5f" % [x['lat'], x['lon']] }
			wkt.push(wkt[0])
      @schools = School.within_area(wkt)
    else
      @schools = School.where(zip: '92129')
    end

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
