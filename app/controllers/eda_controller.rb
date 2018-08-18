class EdaController < ApplicationController
  layout 'dashboard'

  # GET /welcome
  def index
    @tab = 'EDA'
    @subject = 'notebook'
    notebook_path = Rails.root.join('public', 'notebook', '**', '*.ipynb')
    @static_pages = {}
    Dir[notebook_path].each do |file|
      nb = File.basename(file, '.ipynb')
      @static_pages[nb] = file.gsub(/.*public\/notebook/, '')
    end
  end

  def show
    @tab = 'EDA'
    @subject = 'notebook - '+params[:title]
    notebook_path = Rails.root.join('public', 'notebook', '**', params[:title]+'.html')
    files = Dir[notebook_path]
    unless files.empty?
      render(file: files[0])
    else
      render(text: 'notebook missing')
    end
  end

end

