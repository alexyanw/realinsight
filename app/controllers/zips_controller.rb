class ZipsController < ApplicationController
  def query
    scope = params['scope'] || 92129
    @zip_geometry = ZipCode.find_by(zip: scope).wkb_geometry

    respond_to do |format|
      format.html do
        render
      end
      format.json do
        render :json => @zip_geometry.to_json
      end
    end
  end
end
