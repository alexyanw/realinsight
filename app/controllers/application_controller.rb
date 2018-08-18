class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :search_location

  private
    def search_location
      if params[:scope]
        str_scope = params['scope'].chomp
        str_scope.gsub!(/^\s+/, '')
        str_scope.gsub!(/\s+$/, '')
       #if str_scope.match(/^\d{5}$/) # zip
       #  @zip = str_scope.to_i
       #elsif str_scope.match(/^[\d,]*$/)
       #  @pins = str_scope.split(',')
       #else
       #  @scope = Property.address_like(str_scope)
       #end
        @search_scope = str_scope
      end
    end
end
