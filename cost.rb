class LogItem < Struct.new(:timestamp, :seconds, :price_factor)
  def price
    0.006 * price_factor.to_i * minutes * 4
  end
  def minutes
    (seconds.to_i / 15r).ceil / 4r
  end
  def date
    timestamp.sub(/T.*/, '')
  end
end

def usd_to_thb usd
  usd * 33
end

def print_row title, items
  puts "%-15s\t%15s\t%15s" % [
    title,
    "#{usd_to_thb(items.map(&:price).sum).round} THB",
    "%.2f min" % [items.map(&:minutes).sum.to_f]
  ]
end

log_items = File.readlines(ENV['HOME'] + '/.vx-google-cloud-speech.log', chomp: true)
  .map { |c| LogItem.new(*c.split("\t")) }

puts "%-15s\t%15s\t%15s" % ["Date", "Cost", "Time"]
puts "-" * 48
log_items.group_by(&:date).sort.each do |date, items|
  print_row date, items
end
puts "-" * 48
print_row "TOTAL", log_items
puts "=" * 48
